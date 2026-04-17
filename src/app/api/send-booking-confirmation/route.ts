import { NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createCalendarEvent } from '@/lib/google'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'

// Formate une date ISO en date/heure fuseau Europe/Paris (gère DST automatiquement)
function formatParisParts(iso: string) {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find(p => p.type === t)?.value || ''
  return {
    weekday: get('weekday'),
    day: get('day'),
    month: get('month'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

// Shell HTML unifié : wrapper full-width + card centrée (compatible Gmail/Outlook/Apple Mail/Yopmail)
function shell(title: string, innerHtml: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;width:100%;border-collapse:collapse;">
  <tr>
    <td align="center" style="padding:48px 20px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="width:100%;max-width:560px;margin:0 auto;">
        ${innerHtml}
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function buildHtml(firstName: string, iso: string, durationMin: number, topic: string | null, meetingUrl: string) {
  const p = formatParisParts(iso)
  const dateStr = `${p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1)} ${p.day} ${p.month}`
  const timeStr = `${p.hour}h${p.minute}`
  const inner = `
    <tr><td align="center" style="padding-bottom:12px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:44px;color:#fafaf9;font-weight:normal;line-height:1;">
        Noir<span style="color:#ca8a04;font-style:italic;">sur</span>blanc
      </div>
    </td></tr>
    <tr><td align="center" style="padding-bottom:44px;">
      <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Confirmation de rendez-vous</div>
    </td></tr>
    <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:40px 36px;">
      <p style="color:#fafaf9;font-size:17px;line-height:1.6;margin:0 0 18px;">Salut ${firstName.replace(/[<>]/g,'')},</p>
      <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 28px;">Ton rendez-vous est confirmé. À très vite.</p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:22px;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">${dateStr}</p>
        <p style="color:#fafaf9;font-family:Georgia,serif;font-style:italic;font-size:30px;margin:0 0 6px;">${timeStr}</p>
        <p style="color:rgba(255,255,255,0.65);font-size:14px;margin:0;">${durationMin} minutes${topic ? ' · ' + topic.replace(/[<>]/g,'') : ''}</p>
      </div>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td align="center" style="padding:4px 0 8px;">
          <a href="${meetingUrl}" style="display:inline-block;background:#ca8a04;color:#0a0a0a !important;text-decoration:none;padding:16px 36px;border-radius:12px;font-weight:700;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Voir les détails</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td align="center" style="padding-top:36px;">
      <div style="color:rgba(255,255,255,0.3);font-size:11px;letter-spacing:2px;text-transform:uppercase;">Noirsurblanc, le contenu qui travaille pour toi</div>
    </td></tr>`
  return shell('Rendez-vous confirmé', inner)
}

function buildAdminHtml(clientName: string, iso: string, durationMin: number, topic: string | null, notes: string | null, meetingUrl: string) {
  const p = formatParisParts(iso)
  const dateStr = `${p.weekday.charAt(0).toUpperCase() + p.weekday.slice(1)} ${p.day} ${p.month}`
  const timeStr = `${p.hour}h${p.minute}`
  const safe = (s: string) => s.replace(/[<>]/g, '')
  const inner = `
    <tr><td align="center" style="padding-bottom:12px;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:44px;color:#fafaf9;font-weight:normal;line-height:1;">
        Noir<span style="color:#ca8a04;font-style:italic;">sur</span>blanc
      </div>
    </td></tr>
    <tr><td align="center" style="padding-bottom:44px;">
      <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nouveau rendez-vous</div>
    </td></tr>
    <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
      <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
        <strong style="color:#fafaf9;">${safe(clientName)}</strong> vient de réserver un rendez-vous.
      </p>
      <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:18px;">
        <p style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;">${dateStr}</p>
        <p style="color:#fafaf9;font-family:Georgia,serif;font-style:italic;font-size:28px;margin:0 0 6px;">${timeStr}</p>
        <p style="color:rgba(255,255,255,0.65);font-size:13px;margin:0;">${durationMin} minutes</p>
      </div>
      ${topic ? `<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px 16px;margin-bottom:10px;">
        <p style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">Sujet</p>
        <p style="color:#fafaf9;font-size:14px;margin:0;">${safe(topic)}</p>
      </div>` : ''}
      ${notes ? `<div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px 16px;margin-bottom:18px;">
        <p style="color:rgba(255,255,255,0.5);font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin:0 0 4px;">Notes</p>
        <p style="color:rgba(255,255,255,0.85);font-size:13px;margin:0;line-height:1.6;white-space:pre-line;">${safe(notes)}</p>
      </div>` : ''}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td align="center" style="padding-top:14px;">
          <a href="${meetingUrl}" style="display:inline-block;background:#ca8a04;color:#0a0a0a !important;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Voir les détails</a>
        </td></tr>
      </table>
    </td></tr>`
  return shell('Nouveau rendez-vous', inner)
}

export async function POST(req: Request) {
  try {
    const { appointmentId, clientName } = await req.json()
    if (!appointmentId) return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY absente' }, { status: 500 })

    const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: apt } = await supabase.from('appointments').select('*').eq('id', appointmentId).maybeSingle()
    if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    let recipientEmail: string | null = null
    let recipientName: string | null = null
    let isProspect = false

    if (apt.client_id) {
      const { data: client } = await supabase.from('clients').select('email,name').eq('id', apt.client_id).maybeSingle()
      recipientEmail = client?.email || null
      recipientName = client?.name || null
    } else if (apt.prospect_email) {
      recipientEmail = apt.prospect_email
      recipientName = apt.prospect_name
      isProspect = true
    }

    const firstName = (clientName || recipientName || '').split(' ')[0] || 'Bonjour'
    const date = new Date(apt.scheduled_at)
    let meetingUrl = apt.meeting_url || ''

    // 0. Create Google Calendar event + get Meet link (if admin connected Google)
    try {
      const endIso = new Date(date.getTime() + (apt.duration_min || 30) * 60_000).toISOString()
      const title = `${recipientName || firstName}${isProspect ? ' (prospect)' : ''} - Noirsurblanc`
      const description = [
        apt.topic ? `Sujet : ${apt.topic}` : null,
        apt.notes ? `Notes :\n${apt.notes}` : null,
        isProspect && apt.prospect_email ? `Email : ${apt.prospect_email}` : null,
        isProspect && apt.prospect_company ? `Entreprise : ${apt.prospect_company}` : null,
      ].filter(Boolean).join('\n\n')
      const evt = await createCalendarEvent({
        title,
        description,
        startIso: apt.scheduled_at,
        endIso,
        attendeeEmail: recipientEmail || undefined,
      })
      if (evt?.hangoutLink) {
        meetingUrl = evt.hangoutLink
      }
      if (evt?.id) {
        const update: Record<string, unknown> = { google_event_id: evt.id }
        if (evt.hangoutLink) update.meeting_url = evt.hangoutLink
        await supabase.from('appointments').update(update).eq('id', apt.id)
      }
    } catch (e) { console.error('google event', e) }

    // 1. Email confirmation au client/prospect (si email dispo)
    if (recipientEmail) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: FROM,
          to: recipientEmail,
          subject: `Rendez-vous confirmé, ${firstName}`,
          html: buildHtml(firstName, apt.scheduled_at, apt.duration_min, apt.topic, meetingUrl),
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        console.error('Resend (client) error', d)
      }
    }

    // 2. Email de notification admin (liste notification_emails + fallback profils admin)
    try {
      const { data: notifRows } = await supabase.from('notification_emails').select('email')
      let adminEmails = (notifRows || []).map(r => r.email).filter(Boolean) as string[]
      if (adminEmails.length === 0) {
        const { data: admins } = await supabase.from('profiles').select('email').eq('role', 'admin')
        adminEmails = (admins || []).map(a => a.email).filter(Boolean) as string[]
      }
      if (adminEmails.length > 0) {
        const adminName = (recipientName || firstName) + (isProspect ? ' (PROSPECT)' : '')
        const extraNotes = isProspect ? `Email : ${apt.prospect_email}${apt.prospect_company ? '\nEntreprise : ' + apt.prospect_company : ''}${apt.notes ? '\n\n' + apt.notes : ''}` : apt.notes
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            from: FROM,
            to: adminEmails,
            subject: `Nouveau rendez-vous : ${recipientName || firstName}${isProspect ? ' (prospect)' : ''}`,
            html: buildAdminHtml(adminName, apt.scheduled_at, apt.duration_min, apt.topic, extraNotes, meetingUrl),
          }),
        })
      }
    } catch (e) { console.error('admin notify', e) }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('send-booking-confirmation', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
