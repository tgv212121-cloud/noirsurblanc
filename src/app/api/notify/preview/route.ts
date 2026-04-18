import { NextResponse } from 'next/server'

function escape(s: string) { return s.replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c] || c)) }

// Aperçu des emails admin pour verifier le rendu visuel.
// Usage : /api/notify/preview?type=new-message
//         /api/notify/preview?type=booking
//         /api/notify/preview?type=cancel
export async function GET(req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get('type') || 'new-message'

  let html = ''

  if (type === 'new-message') {
    const clientName = 'Thomas Gildas'
    const company = 'DigitalTimes'
    const previewText = "Salut Enzo, j'ai besoin que tu relises mon dernier post LinkedIn avant que je le publie cet après-midi. Peux-tu regarder quand tu as 10 min ? Merci !"
    const conversationUrl = 'https://noirsurblanc.vercel.app/clients/abc-123-demo?tab=conversation'
    html = `<!DOCTYPE html>
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
        <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nouveau message</div>
      </td></tr>
      <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
        <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
          <strong style="color:#fafaf9;">${escape(clientName)}</strong> <span style="color:rgba(255,255,255,0.5);">(${escape(company)})</span> t'a envoyé un message.
        </p>
        <div style="background:rgba(255,255,255,0.04);border-left:2px solid #ca8a04;border-radius:6px;padding:18px 20px;margin-bottom:28px;">
          <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${escape(previewText)}</p>
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td align="center">
            <a href="${conversationUrl}" style="display:inline-block;background:linear-gradient(135deg,#a16207,#ca8a04,#eab308);color:#0a0a0a;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">
              Voir la conversation
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
  } else if (type === 'booking') {
    html = `<!DOCTYPE html>
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
        <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nouveau rendez-vous</div>
      </td></tr>
      <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
        <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
          <strong style="color:#fafaf9;">Thomas Gildas</strong> a réservé un appel.
        </p>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin-bottom:24px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Vendredi 24 avril à 14h30</p>
          <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:0;">30 minutes · en visio</p>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 14px;"><strong style="color:rgba(255,255,255,0.7);">Sujet :</strong> Refonte complète du positionnement LinkedIn</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
  } else if (type === 'cancel') {
    html = `<!DOCTYPE html>
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
        <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Annulation de rendez-vous</div>
      </td></tr>
      <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
        <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
          <strong style="color:#fafaf9;">Thomas Gildas</strong> vient d'annuler son rendez-vous.
        </p>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;">
          <p style="color:rgba(255,255,255,0.5);font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 6px;text-decoration:line-through;">Vendredi 24 avril à 14h30</p>
        </div>
        <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:22px 0 0;">Le créneau est à nouveau disponible pour d'autres réservations.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
  } else if (type === 'new-post') {
    const firstName = 'Thomas'
    const previewText = "5 leçons que j'ai apprises en passant de 0 à 10k€ MRR en 8 mois. Thread LinkedIn. Aucun hack. Aucune promesse. Juste ce qui a marché (et ce qui a foiré)."
    const portalUrl = 'https://noirsurblanc.vercel.app/portal/abc-123-demo?tab=calendar'
    html = `<!DOCTYPE html>
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
  } else if (type === 'admin-message') {
    const firstName = 'Thomas'
    const previewText = "Salut Thomas, j'ai relu ton post, 2 petites retouches à faire sur le hook. Je te mets mes remarques dans le fichier joint. Jette un œil quand tu peux."
    const portalUrl = 'https://noirsurblanc.vercel.app/portal/abc-123-demo?tab=messages'
    html = `<!DOCTYPE html>
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
        <div style="color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:3px;text-transform:uppercase;">Nouveau message d'Enzo</div>
      </td></tr>
      <tr><td style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:36px 32px;">
        <p style="color:rgba(255,255,255,0.78);font-size:15px;line-height:1.7;margin:0 0 22px;">
          Salut <strong style="color:#fafaf9;">${escape(firstName)}</strong>, Enzo vient de te répondre sur ton espace Noirsurblanc.
        </p>
        <div style="background:rgba(255,255,255,0.04);border-left:2px solid #ca8a04;border-radius:6px;padding:18px 20px;margin-bottom:28px;">
          <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;margin:0;white-space:pre-wrap;">${escape(previewText)}</p>
        </div>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td align="center">
            <a href="${portalUrl}" style="display:inline-block;background:linear-gradient(135deg,#a16207,#ca8a04,#eab308);color:#0a0a0a;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;">
              Ouvrir la conversation
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
  } else {
    html = `<html><body style="font-family:sans-serif;padding:40px;"><h1>Type inconnu</h1><p>Utilise ?type=new-message, ?type=admin-message, ?type=booking, ou ?type=cancel</p></body></html>`
  }

  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
