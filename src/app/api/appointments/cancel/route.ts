import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { deleteCalendarEvent } from '@/lib/google'

export async function POST(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const sb = getAdminSupabase()
    const { data: apt } = await sb.from('appointments').select('id, google_event_id, status').eq('id', id).maybeSingle()
    if (!apt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const row = apt as { id: string; google_event_id: string | null; status: string }

    // Mark as cancelled (frees the slot via partial unique index)
    await sb.from('appointments').update({ status: 'cancelled' }).eq('id', row.id)

    // Delete from Google Calendar if connected and we have an event id
    if (row.google_event_id) {
      try {
        await deleteCalendarEvent(row.google_event_id)
      } catch (e) { console.error('google delete', e) }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('cancel', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
