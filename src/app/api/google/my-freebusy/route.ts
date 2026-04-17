import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getBusySlotsForUser } from '@/lib/google'

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
    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ busy: [] })
    const { timeMin, timeMax } = await req.json()
    if (!timeMin || !timeMax) return NextResponse.json({ busy: [] })
    const busy = await getBusySlotsForUser(userId, timeMin, timeMax)
    return NextResponse.json({ busy })
  } catch (e) {
    console.error('my-freebusy', e)
    return NextResponse.json({ busy: [] })
  }
}
