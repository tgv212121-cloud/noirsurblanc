import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

// Webhook que Unipile appelle apres une connexion reussie d'un compte LinkedIn.
// Le payload contient le account_id Unipile qu'on associe a l'user.
//
// Doc : https://developer.unipile.com/docs/webhooks

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Le payload contient typiquement : { status: 'CREATION_SUCCESS', account_id: '...', name: 'userIdQuOnAEnvoye' }
    const { status, account_id, name } = body
    if (status !== 'CREATION_SUCCESS' || !account_id || !name) {
      return NextResponse.json({ ok: true, ignored: true })
    }

    const userId = name as string
    const sb = getAdminSupabase()

    // Stocke le account_id sur le profile de l'user, ET sur le client lie s'il y en a un
    await sb.from('profiles').update({ unipile_account_id: account_id }).eq('id', userId)
    const { data: prof } = await sb.from('profiles').select('client_id').eq('id', userId).maybeSingle()
    const clientId = (prof as { client_id?: string } | null)?.client_id
    if (clientId) {
      await sb.from('clients').update({ unipile_account_id: account_id }).eq('id', clientId)
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('unipile webhook', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
