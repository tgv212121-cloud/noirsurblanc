import { NextResponse } from 'next/server'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'

// Dictionnaire de prénoms français couramment oubliés (version sans accent → version correcte)
const ACCENTED_NAMES: Record<string, string> = {
  // é
  lea: 'Léa', leon: 'Léon', leonie: 'Léonie', leopold: 'Léopold', leo: 'Léo',
  chloe: 'Chloé', zoe: 'Zoé', noe: 'Noé', noemie: 'Noémie', salome: 'Salomé',
  amelie: 'Amélie', emile: 'Émile', emilie: 'Émilie', elise: 'Élise', elodie: 'Élodie',
  celine: 'Céline', cedric: 'Cédric', cecile: 'Cécile', celestine: 'Célestine',
  gerald: 'Gérald', geraldine: 'Géraldine', gerard: 'Gérard', gerome: 'Gérôme',
  valerie: 'Valérie', valery: 'Valéry', veronique: 'Véronique',
  nicolas: 'Nicolas', stephanie: 'Stéphanie', stephane: 'Stéphane',
  desire: 'Désiré', deborah: 'Déborah',
  regis: 'Régis', regine: 'Régine', remi: 'Rémi', remy: 'Rémy',
  sebastien: 'Sébastien', severine: 'Séverine',
  edouard: 'Édouard', evariste: 'Évariste',
  theo: 'Théo', theodore: 'Théodore', therese: 'Thérèse',
  // è
  helene: 'Hélène', irene: 'Irène', genevieve: 'Geneviève',
  solene: 'Solène', mylene: 'Mylène', marlene: 'Marlène', yvette: 'Yvette',
  // ê
  jerome: 'Jérôme',
  // à
  francois: 'François', francoise: 'Françoise',
  // ï ë
  loic: 'Loïc', anais: 'Anaïs', heloise: 'Héloïse', adele: 'Adèle',
  // ç
  // ô
  // combinaisons communes
  andre: 'André', agathe: 'Agathe', nadege: 'Nadège', nadia: 'Nadia',
  esteban: 'Esteban', eva: 'Eva',
}

function normalize(raw: string): string {
  const cleaned = raw.replace(/[<>]/g, '').trim()
  if (!cleaned) return ''

  // Capitalize each word (separated by space, hyphen, or apostrophe)
  return cleaned.split(/(\s+|-|')/).map((token) => {
    if (!token || /^(\s+|-|')$/.test(token)) return token
    const lower = token.toLocaleLowerCase('fr-FR')
    // Try dictionary lookup (strip existing accents for the key)
    const key = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (ACCENTED_NAMES[key]) return ACCENTED_NAMES[key]
    return lower.charAt(0).toLocaleUpperCase('fr-FR') + lower.slice(1)
  }).join('')
}

function buildHtml(firstName: string, inviteUrl: string) {
  const name = normalize(firstName)
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a; padding:48px 20px; font-family: Helvetica, Arial, sans-serif;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:12px;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size:44px; color:#fafaf9; font-weight:normal; line-height:1;">
            Noir<span style="color:#ca8a04; font-style:italic;">sur</span>blanc
          </div>
        </td></tr>
        <tr><td align="center" style="padding-bottom:44px;">
          <div style="color:rgba(255,255,255,0.55); font-size:11px; letter-spacing:3px; text-transform:uppercase;">
            Invitation
          </div>
        </td></tr>
        <tr><td style="background:#141414; border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:40px 36px;">
          <p style="color:#fafaf9; font-size:17px; line-height:1.6; margin:0 0 18px;">
            Salut ${name},
          </p>
          <p style="color:rgba(255,255,255,0.78); font-size:15px; line-height:1.7; margin:0 0 24px;">
            Bienvenue chez Noirsurblanc. Pour qu'on puisse commencer à travailler ensemble et créer du contenu LinkedIn qui te ressemble, il me faut quelques infos sur toi.
          </p>
          <p style="color:rgba(255,255,255,0.78); font-size:15px; line-height:1.7; margin:0 0 28px;">
            Clique sur le bouton ci-dessous pour remplir ton questionnaire d'onboarding (environ 10 minutes) et créer ton espace personnel.
          </p>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td align="center" style="padding:8px 0 6px;">
              <a href="${inviteUrl}" style="display:inline-block; background:#ca8a04; color:#0a0a0a !important; text-decoration:none; padding:18px 44px; border-radius:12px; font-weight:700; font-size:13px; letter-spacing:2px; text-transform:uppercase; font-family: Helvetica, Arial, sans-serif;">
                Démarrer l'onboarding
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:36px;">
          <div style="color:rgba(255,255,255,0.3); font-size:11px; letter-spacing:2px; text-transform:uppercase;">
            Noirsurblanc, le contenu qui travaille pour toi
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>`
}

export async function POST(req: Request) {
  try {
    const { email, firstName, inviteUrl } = await req.json()
    if (!email || !firstName || !inviteUrl) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY absente côté serveur' }, { status: 500 })
    }

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: `Bienvenue sur Noirsurblanc, ${normalize(firstName)}`,
        html: buildHtml(firstName, inviteUrl),
      }),
    })

    const data = await r.json()
    if (!r.ok) {
      console.error('Resend error', data)
      return NextResponse.json({ error: data?.message || 'Erreur Resend' }, { status: r.status })
    }
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('send-invite error', e)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
