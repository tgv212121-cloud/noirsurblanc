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

async function revoke(refreshToken: string) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: 'POST' })
  } catch (e) { console.error('revoke', e) }
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const sb = getAdminSupabase()
    const { data } = await sb.from('google_tokens').select('id, refresh_token').eq('user_id', userId).maybeSingle()
    if (!data) return NextResponse.json({ ok: true })
    const row = data as { id: string; refresh_token: string }
    await revoke(row.refresh_token)
    await sb.from('google_tokens').delete().eq('id', row.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('disconnect', e)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
