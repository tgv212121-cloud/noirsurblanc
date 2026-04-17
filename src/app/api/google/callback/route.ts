import { NextResponse } from 'next/server'
import { exchangeCode, fetchUserInfo } from '@/lib/google'
import { getAdminSupabase } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const { origin, searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const stateRaw = searchParams.get('state')

  let userId: string | null = null
  let returnTo = '/settings'
  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, 'base64url').toString())
      userId = decoded.userId || null
      returnTo = decoded.returnTo || '/settings'
    } catch { /* ignore */ }
  }

  if (error) return NextResponse.redirect(`${origin}${returnTo}?google=error&reason=${encodeURIComponent(error)}`)
  if (!code) return NextResponse.redirect(`${origin}${returnTo}?google=error&reason=no_code`)

  try {
    const tokens = await exchangeCode(origin, code)
    if (!tokens.refresh_token) {
      return NextResponse.redirect(`${origin}${returnTo}?google=error&reason=no_refresh_token`)
    }
    const userInfo = await fetchUserInfo(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const sb = getAdminSupabase()

    // Determine if this user is admin → isPrimary semantics
    let isPrimary = false
    if (userId) {
      const { data: prof } = await sb.from('profiles').select('role').eq('id', userId).maybeSingle()
      const role = (prof as { role?: string } | null)?.role
      if (role === 'admin') {
        // Check if there's already a primary; if not, make this one primary
        const { data: existingPrimary } = await sb.from('google_tokens').select('id, user_id').eq('is_primary', true).maybeSingle()
        if (!existingPrimary) isPrimary = true
        else if ((existingPrimary as { user_id?: string | null }).user_id === userId) isPrimary = true
      }
    }

    // Upsert by user_id (one token per user)
    if (userId) {
      await sb.from('google_tokens').upsert({
        user_id: userId,
        email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        calendar_id: 'primary',
        is_primary: isPrimary,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    } else {
      // Legacy path: no userId in state → treat as primary admin upsert by email
      await sb.from('google_tokens').update({ is_primary: false }).eq('is_primary', true)
      await sb.from('google_tokens').upsert({
        email: userInfo.email,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        calendar_id: 'primary',
        is_primary: true,
        updated_at: new Date().toISOString(),
      })
    }

    return NextResponse.redirect(`${origin}${returnTo}?google=connected`)
  } catch (e) {
    console.error('google callback', e)
    return NextResponse.redirect(`${origin}${returnTo}?google=error&reason=exchange_failed`)
  }
}
