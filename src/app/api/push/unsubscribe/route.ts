import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json()
    if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 })
    const sb = getAdminSupabase()
    await sb.from('push_subscriptions').delete().eq('endpoint', endpoint)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('push/unsubscribe', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
