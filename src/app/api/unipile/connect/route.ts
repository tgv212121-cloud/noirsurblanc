import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

// Genere un Hosted Auth Link Unipile pour que l'utilisateur connecte son LinkedIn.
// L'utilisateur ouvrira le lien, scannera le QR code, et son LinkedIn sera lie a Unipile.
//
// Body requis : { userId: string } (auth.users.id du user connecte)
//
// Resultat : { url: string } a ouvrir dans le navigateur du user

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY
const UNIPILE_DSN = process.env.UNIPILE_DSN // ex: https://api1.unipile.com:13xxx
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://noirsurblanc.vercel.app'

export async function POST(req: Request) {
  try {
    if (!UNIPILE_API_KEY || !UNIPILE_DSN) {
      return NextResponse.json({ error: 'Unipile not configured. Add UNIPILE_API_KEY and UNIPILE_DSN env vars.' }, { status: 500 })
    }

    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    // L'API Unipile attend un payload Hosted Auth Link minimal
    // Doc : https://developer.unipile.com/reference/accountscontroller_requestauthurl
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h
    const payload: Record<string, unknown> = {
      type: 'create',
      providers: ['LINKEDIN'],
      api_url: UNIPILE_DSN,
      expiresOn: expiresAt,
      name: userId, // identifie l'user dans le webhook
    }
    // Optional URLs : on inclut seulement si APP_URL est defini correctement
    if (APP_URL && !APP_URL.includes('localhost')) {
      payload.success_redirect_url = `${APP_URL}/api/unipile/connected?userId=${encodeURIComponent(userId)}`
      payload.failure_redirect_url = `${APP_URL}/settings?unipile=failed`
      payload.notify_url = `${APP_URL}/api/unipile/webhook`
    }

    const r = await fetch(`${UNIPILE_DSN}/api/v1/hosted/accounts/link`, {
      method: 'POST',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })
    const txt = await r.text()
    if (!r.ok) {
      console.error('[unipile] hosted link error', r.status, txt)
      return NextResponse.json({
        error: 'Unipile API error',
        status: r.status,
        detail: txt.slice(0, 500),
      }, { status: 500 })
    }
    let d: { url?: string } = {}
    try { d = JSON.parse(txt) } catch {}
    const url = d.url
    if (!url) {
      console.error('[unipile] no url in response', txt)
      return NextResponse.json({ error: 'No url returned by Unipile', detail: txt.slice(0, 500) }, { status: 500 })
    }
    return NextResponse.json({ url })
  } catch (e) {
    console.error('unipile connect', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
