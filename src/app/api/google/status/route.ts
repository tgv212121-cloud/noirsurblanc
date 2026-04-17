import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const sb = getAdminSupabase()
    const { data } = await sb.from('google_tokens').select('email, calendar_id, is_primary').eq('is_primary', true).maybeSingle()
    if (!data) return NextResponse.json({ connected: false })
    return NextResponse.json({
      connected: true,
      email: (data as { email: string }).email,
      calendarId: (data as { calendar_id: string }).calendar_id,
    })
  } catch (e) {
    console.error('google status', e)
    return NextResponse.json({ connected: false })
  }
}
