import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://noirsurblanc.vercel.app'
const COOLDOWN_MS = 30 * 60 * 1000 // 30 min

function escape(s: string) { return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c)) }
function truncate(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + '…' : s }

function buildHtml(firstName: string, previewText: string, portalUrl: string) {
  return `<!DOCTYPE html>
<html lang="fr"><body style="margin:0;padding:0;background:#0a0a0a;font-family:Helvetica,Arial,sans-serif;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a;width:100%;">
  <tr><td align="center" style="padding:48px 20px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="width:100%;max-width:560px;margin:0 auto;">
      <tr><td align="center" style="padding-bottom:12px;">
        <div style="font-family:Georgia,serif;font-size:44px;color:#fafaf9;line-height:1;">
          Noir<span style="color:#ca8a04;font-style:italic;">sur</span>blanc
        </div>
      </td></tr>
      <tr><td align="center" style="padding-bottom:44px;">
        <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nouveau contenu à valider</div>
      </td></tr>
      <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
        <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
          Salut <strong style="color:#fafaf9;">${escape(firstName)}</strong>, Enzo a ajouté un nouveau post dans ton calendrier.
        </p>
        <div style="background:rgba(255,255,255,0.04);border-left:2px solid #ca8a04;border-radius:6px;padding:18px 20px;margin-bottom:28px;">
          <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${escape(previewText)}</p>
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td align="center">
            <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#a16207,#ca8a04,#eab308);color:#0a0a0a;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">
              Voir dans le calendrier
            </a>
          </td></tr>
        </table>
      </td></tr>
      <tr><td align="center" style="padding-top:24px;">
        <p style="color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0;">Noirsurblanc, le contenu qui travaille pour toi</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

export async function POST(req: Request) {
  try {
    const { clientId, preview } = await req.json()
    if (!clientId) return NextResponse.json({ ok: true, skipped: true })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ ok: true, noKey: true })

    const sb = getAdminSupabase()
    const { data: client } = await sb
      .from('clients')
      .select('name, email, last_post_notified_at')
      .eq('id', clientId)
      .maybeSingle()
    const c = client as { name?: string; email?: string; last_post_notified_at?: string | null } | null
    if (!c || !c.email) return NextResponse.json({ ok: true, noClientEmail: true })

    // Cooldown 30 min
    const last = c.last_post_notified_at ? new Date(c.last_post_notified_at).getTime() : 0
    if (Date.now() - last < COOLDOWN_MS) return NextResponse.json({ ok: true, throttled: true })

    const firstName = (c.name || '').split(' ')[0] || 'Bonjour'
    const previewText = truncate((preview || '').trim() || 'Un nouveau post est prêt à être validé.', 280)
    const portalUrl = `${APP_URL}/portal/${clientId}?tab=calendar`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: c.email,
        subject: `Nouveau post à valider sur ton espace`,
        html: buildHtml(firstName, previewText, portalUrl),
      }),
    })
    if (!r.ok) { console.error('Resend new-post', await r.text()); return NextResponse.json({ ok: true, sent: false }) }
    await sb.from('clients').update({ last_post_notified_at: new Date().toISOString() }).eq('id', clientId)
    return NextResponse.json({ ok: true, sent: true })
  } catch (e) {
    console.error('notify new-post', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
