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

export async function GET(req: Request) {
  try {
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ connected: false })
    const sb = getAdminSupabase()
    const { data } = await sb.from('google_tokens').select('email').eq('user_id', userId).maybeSingle()
    if (!data) return NextResponse.json({ connected: false })
    return NextResponse.json({ connected: true, email: (data as { email: string }).email })
  } catch (e) {
    console.error('my-status', e)
    return NextResponse.json({ connected: false })
  }
}
