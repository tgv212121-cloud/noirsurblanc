import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

// Met a jour clients.last_seen_at pour le client courant (ping regulier depuis /portal/[id]).
export async function POST(req: Request) {
  try {
    const { clientId } = await req.json()
    if (!clientId) return NextResponse.json({ error: 'Missing clientId' }, { status: 400 })
    const sb = getAdminSupabase()
    await sb.from('clients').update({ last_seen_at: new Date().toISOString() }).eq('id', clientId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('presence ping', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
