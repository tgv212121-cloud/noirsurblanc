import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

// Met a jour profiles.last_seen_at de l'admin courant (ping depuis les pages admin).
export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    const sb = getAdminSupabase()
    await sb.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', userId).eq('role', 'admin')
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('admin presence ping', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
