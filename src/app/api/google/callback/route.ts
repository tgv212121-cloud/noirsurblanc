import { NextResponse } from 'next/server'
import { exchangeCode, fetchUserInfo } from '@/lib/google'
import { getAdminSupabase } from '@/lib/supabase-admin'

export async function GET(req: Request) {
  const { origin, searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${origin}/settings?google=error&reason=${encodeURIComponent(error)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/settings?google=error&reason=no_code`)
  }

  try {
    const tokens = await exchangeCode(origin, code)
    if (!tokens.refresh_token) {
      // Google only returns refresh_token on first consent. If user already consented without prompt=consent, we won't get one.
      // Our buildAuthUrl forces prompt=consent so this should always work.
      return NextResponse.redirect(`${origin}/settings?google=error&reason=no_refresh_token`)
    }
    const userInfo = await fetchUserInfo(tokens.access_token)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    const sb = getAdminSupabase()
    // Reset any existing primary flag (one primary at a time)
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
    }, { onConflict: 'email' })

    return NextResponse.redirect(`${origin}/settings?google=connected`)
  } catch (e) {
    console.error('google callback', e)
    return NextResponse.redirect(`${origin}/settings?google=error&reason=exchange_failed`)
  }
}
