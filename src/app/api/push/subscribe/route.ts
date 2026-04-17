import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSupabase } from '@/lib/supabase-admin'

async function getAuthUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  try {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await sb.auth.getUser(token)
    return data.user?.id || null
  } catch { return null }
}

export async function POST(req: Request) {
  try {
    const { endpoint, p256dh, auth, userAgent } = await req.json()
    if (!endpoint || !p256dh || !auth) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const sb = getAdminSupabase()
    await sb.from('push_subscriptions').upsert(
      { user_id: userId, endpoint, p256dh, auth, user_agent: userAgent || null },
      { onConflict: 'user_id,endpoint' },
    )
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('push/subscribe', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
