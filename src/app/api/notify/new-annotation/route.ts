import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://noirsurblanc.vercel.app'

function escape(s: string) { return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c)) }
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s }

export async function POST(req: Request) {
  try {
    const { postId, clientId, selectedText, textContent, hasVoice } = await req.json()
    if (!postId || !clientId) return NextResponse.json({ ok: true, skipped: true })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ ok: true, noKey: true })

    const sb = getAdminSupabase()

    // Recupere le client + les emails admin
    const { data: client } = await sb.from('clients').select('name').eq('id', clientId).maybeSingle()
    const clientName = (client as { name?: string } | null)?.name || 'Un client'

    const { data: notifRows } = await sb.from('notification_emails').select('email')
    let adminEmails = (notifRows || []).map((r: { email: string }) => r.email).filter(Boolean) as string[]
    if (adminEmails.length === 0) {
      const { data: admins } = await sb.from('profiles').select('email').eq('role', 'admin')
      adminEmails = (admins || []).map((a: { email: string }) => a.email).filter(Boolean)
    }
    if (adminEmails.length === 0) return NextResponse.json({ ok: true, noAdmin: true })

    const passage = truncate((selectedText || '').trim(), 120)
    const comment = textContent ? truncate(textContent.trim(), 200) : (hasVoice ? '🎤 Commentaire vocal' : '')
    const dashboardUrl = `${APP_URL}/clients/${clientId}?tab=calendar`

    const html = `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;width:100%;">
  <tr><td align="center" style="padding:56px 20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" style="width:100%;max-width:480px;margin:0 auto;">
      <tr><td align="center" style="padding-bottom:32px;">
        <div style="font-family:Georgia,serif;font-size:32px;color:#fafaf9;line-height:1;">
          Noir<span style="color:#ca8a04;font-style:italic;">sur</span>blanc
        </div>
      </td></tr>
      <tr><td align="center" style="padding-bottom:12px;">
        <p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.5;margin:0;">
          <strong style="color:#fafaf9;">${escape(clientName)}</strong> a commenté un passage d&apos;un post.
        </p>
      </td></tr>
      ${passage ? `<tr><td style="padding-bottom:14px;">
        <div style="background:rgba(202,138,4,0.08);border-left:2px solid #ca8a04;border-radius:6px;padding:12px 14px;">
          <p style="color:rgba(255,255,255,0.7);font-size:13px;font-style:italic;margin:0;">« ${escape(passage)} »</p>
        </div>
      </td></tr>` : ''}
      ${comment ? `<tr><td style="padding-bottom:24px;">
        <p style="color:rgba(255,255,255,0.82);font-size:14px;line-height:1.5;margin:0;">${escape(comment)}</p>
      </td></tr>` : ''}
      <tr><td align="center">
        <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#a16207,#ca8a04,#eab308);color:#0a0a0a;text-decoration:none;padding:12px 26px;border-radius:10px;font-weight:600;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">
          Voir
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: adminEmails,
        subject: `Nouveau commentaire de ${clientName}`,
        html,
      }),
    })
    if (!r.ok) { console.error('Resend new-annotation', await r.text()); return NextResponse.json({ ok: true, sent: false }) }
    return NextResponse.json({ ok: true, sent: true })
  } catch (e) {
    console.error('notify new-annotation', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
