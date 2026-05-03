import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

// GET /api/unipile/status?userId=...
// Renvoie { connected: boolean, accountId?: string }
export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')
  if (!userId) return NextResponse.json({ connected: false })
  const sb = getAdminSupabase()
  const { data } = await sb.from('profiles').select('unipile_account_id').eq('id', userId).maybeSingle()
  const accountId = (data as { unipile_account_id?: string } | null)?.unipile_account_id || null
  return NextResponse.json({ connected: !!accountId, accountId })
}
