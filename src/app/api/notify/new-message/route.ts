import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://noirsurblanc.vercel.app'

function escape(s: string) { return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c)) }
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s }

const COOLDOWN_MS = 5 * 60 * 1000 // 5 min

function shellMinimal(sentence: string, ctaLabel: string, ctaUrl: string) {
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;width:100%;">
  <tr><td align="center" style="padding:56px 20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" style="width:100%;max-width:480px;margin:0 auto;">
      <tr><td align="center" style="padding-bottom:32px;">
        <div style="font-family:Georgia,serif;font-size:32px;color:#fafaf9;line-height:1;">
          Noir<span style="color:#ca8a04;font-style:italic;">sur</span>blanc
        </div>
      </td></tr>
      <tr><td align="center" style="padding-bottom:24px;">
        <p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.5;margin:0;">${sentence}</p>
      </td></tr>
      <tr><td align="center">
        <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#a16207,#ca8a04,#eab308);color:#0a0a0a;text-decoration:none;padding:12px 26px;border-radius:10px;font-weight:600;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">
          ${ctaLabel}
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

function buildAdminHtml(clientName: string, _company: string, _previewText: string, conversationUrl: string) {
  return shellMinimal(`Nouveau message de <strong style="color:#fafaf9;">${escape(clientName)}</strong>.`, 'Voir', conversationUrl)
}

function buildClientHtml(firstName: string, _previewText: string, portalUrl: string) {
  return shellMinimal(`Nouveau message d&apos;Enzo, <strong style="color:#fafaf9;">${escape(firstName)}</strong>.`, 'Voir', portalUrl)
}

export async function POST(req: Request) {
  try {
    const { clientId, sender, preview } = await req.json()
    if (!clientId || (sender !== 'client' && sender !== 'admin')) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ ok: true, noKey: true })

    const sb = getAdminSupabase()
    const { data: client } = await sb
      .from('clients')
      .select('name, email, company, last_message_notified_at, last_admin_notified_at')
      .eq('id', clientId)
      .maybeSingle()
    const c = client as {
      name?: string; email?: string; company?: string;
      last_message_notified_at?: string | null;
      last_admin_notified_at?: string | null;
    } | null
    if (!c) return NextResponse.json({ ok: true, notFound: true })

    const previewText = truncate((preview || '').trim() || '(message sans texte)', 280)
    const now = Date.now()

    if (sender === 'client') {
      // Notif vers admin
      const last = c.last_message_notified_at ? new Date(c.last_message_notified_at).getTime() : 0
      if (now - last < COOLDOWN_MS) return NextResponse.json({ ok: true, throttled: true })

      const { data: notifRows } = await sb.from('notification_emails').select('email')
      let adminEmails = (notifRows || []).map((r: { email: string }) => r.email).filter(Boolean) as string[]
      if (adminEmails.length === 0) {
        const { data: admins } = await sb.from('profiles').select('email').eq('role', 'admin')
        adminEmails = (admins || []).map((a: { email: string }) => a.email).filter(Boolean)
      }
      if (adminEmails.length === 0) return NextResponse.json({ ok: true, noAdmin: true })

      const conversationUrl = `${APP_URL}/clients/${clientId}?tab=conversation`
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          from: FROM,
          to: adminEmails,
          subject: `Nouveau message de ${c.name || 'Un client'}`,
          html: buildAdminHtml(c.name || 'Un client', c.company || '', previewText, conversationUrl),
        }),
      })
      if (!r.ok) { console.error('Resend admin notif', await r.text()); return NextResponse.json({ ok: true, sent: false }) }
      await sb.from('clients').update({ last_message_notified_at: new Date().toISOString() }).eq('id', clientId)
      return NextResponse.json({ ok: true, sent: true, direction: 'to-admin' })
    }

    // sender === 'admin' : notif vers le client
    if (!c.email) return NextResponse.json({ ok: true, noClientEmail: true })
    const last = c.last_admin_notified_at ? new Date(c.last_admin_notified_at).getTime() : 0
    if (now - last < COOLDOWN_MS) return NextResponse.json({ ok: true, throttled: true })

    const firstName = (c.name || '').split(' ')[0] || 'Bonjour'
    const portalUrl = `${APP_URL}/portal/${clientId}?tab=messages`
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: c.email,
        subject: `Nouveau message d'Enzo sur ton espace`,
        html: buildClientHtml(firstName, previewText, portalUrl),
      }),
    })
    if (!r.ok) { console.error('Resend client notif', await r.text()); return NextResponse.json({ ok: true, sent: false }) }
    await sb.from('clients').update({ last_admin_notified_at: new Date().toISOString() }).eq('id', clientId)
    return NextResponse.json({ ok: true, sent: true, direction: 'to-client' })
  } catch (e) {
    console.error('notify new-message', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
