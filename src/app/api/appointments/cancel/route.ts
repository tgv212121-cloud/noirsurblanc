import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { deleteCalendarEvent } from '@/lib/google'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'

function formatParisParts(iso: string) {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value || ''
  return { weekday: get('weekday'), day: get('day'), month: get('month'), hour: get('hour'), minute: get('minute') }
}

export async function POST(req: Request) {
  try {
    const { id, cancelledByAdmin } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const sb = getAdminSupabase()
    const { data: apt } = await sb.from('appointments').select('*').eq('id', id).maybeSingle()
    if (!apt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const row = apt as {
      id: string
      client_id: string | null
      google_event_id: string | null
      scheduled_at: string
      prospect_email: string | null
      prospect_name: string | null
    }

    // Mark as cancelled (frees the slot via partial unique index)
    await sb.from('appointments').update({ status: 'cancelled' }).eq('id', row.id)

    // Delete from Google Calendar if connected
    if (row.google_event_id) {
      try { await deleteCalendarEvent(row.google_event_id) } catch (e) { console.error('google delete', e) }
    }

    // Only notify admins when a CLIENT (or prospect) cancels. When admin cancels, no notif.
    if (cancelledByAdmin === false) {
      try {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) return NextResponse.json({ ok: true })

        let recipientName: string | null = null
        if (row.client_id) {
          const { data: client } = await sb.from('clients').select('name').eq('id', row.client_id).maybeSingle()
          recipientName = (client as { name?: string } | null)?.name || null
        } else {
          recipientName = row.prospect_name
        }
        const firstName = (recipientName || '').split(' ')[0] || 'Un client'

        const { data: notifRows } = await sb.from('notification_emails').select('email')
        let adminEmails = (notifRows || []).map((r: { email: string }) => r.email).filter(Boolean) as string[]
        if (adminEmails.length === 0) {
          const { data: admins } = await sb.from('profiles').select('email').eq('role', 'admin')
          adminEmails = (admins || []).map((a: { email: string }) => a.email).filter(Boolean)
        }

        if (adminEmails.length > 0) {
          const p = formatParisParts(row.scheduled_at)
          const dateStr = `${p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1)} ${p.day} ${p.month} à ${p.hour}h${p.minute}`
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              from: FROM,
              to: adminEmails,
              subject: `Annulation : ${recipientName || firstName}`,
              html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;width:100%;">
  <tr><td align="center" style="padding:48px 20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="width:100%;max-width:560px;margin:0 auto;">
      <tr><td align="center" style="padding-bottom:12px;">
        <div style="font-family:Georgia,serif;font-size:44px;color:#fafaf9;line-height:1;">
          Noir<span style="color:#ca8a04;font-style:italic;">sur</span>blanc
        </div>
      </td></tr>
      <tr><td align="center" style="padding-bottom:44px;">
        <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Annulation de rendez-vous</div>
      </td></tr>
      <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
        <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
          <strong style="color:#fafaf9;">${(recipientName || firstName).replace(/[<>]/g, '')}</strong> vient d&apos;annuler son rendez-vous.
        </p>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;text-decoration:line-through;">${dateStr}</p>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:22px 0 0;">Le créneau est à nouveau disponible pour d&apos;autres réservations.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
            }),
          })
        }
      } catch (e) { console.error('cancel notify', e) }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('cancel', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
