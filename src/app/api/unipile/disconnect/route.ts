import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY
const UNIPILE_DSN = process.env.UNIPILE_DSN

// POST /api/unipile/disconnect { userId }
// Supprime le compte sur Unipile + retire le account_id de la DB.
export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const sb = getAdminSupabase()
    const { data } = await sb.from('profiles').select('unipile_account_id, client_id').eq('id', userId).maybeSingle()
    const accountId = (data as { unipile_account_id?: string } | null)?.unipile_account_id
    const clientId = (data as { client_id?: string } | null)?.client_id

    // Supprime cote Unipile (best effort)
    if (accountId && UNIPILE_API_KEY && UNIPILE_DSN) {
      try {
        await fetch(`${UNIPILE_DSN}/api/v1/accounts/${accountId}`, {
          method: 'DELETE',
          headers: { 'X-API-KEY': UNIPILE_API_KEY },
        })
      } catch (e) { console.error('[unipile] delete account failed', e) }
    }

    // Supprime cote DB
    await sb.from('profiles').update({ unipile_account_id: null }).eq('id', userId)
    if (clientId) await sb.from('clients').update({ unipile_account_id: null }).eq('id', clientId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('unipile disconnect', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
