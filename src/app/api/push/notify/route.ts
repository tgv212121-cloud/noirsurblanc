import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { sendPushToAdmins, sendPushToClient } from '@/lib/push-server'

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

/**
 * Body: { kind: 'message' | 'post', clientId: string, excerpt?: string, from?: 'admin' | 'client' }
 * - kind=message, from=admin → notify the client
 * - kind=message, from=client → notify admins
 * - kind=post, from=admin → notify the client
 */
export async function POST(req: Request) {
  try {
    const { kind, clientId, excerpt, from } = await req.json()
    if (!kind || !clientId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const userId = await getAuthUserId(req)
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    // Fetch the client to resolve the name and verify caller has access
    const sb = getAdminSupabase()
    const { data: clientRow } = await sb.from('clients').select('name, auth_user_id').eq('id', clientId).maybeSingle()
    if (!clientRow) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    const clientData = clientRow as { name: string; auth_user_id: string | null }

    // Verify access : either caller is admin OR caller is the linked client
    const { data: prof } = await sb.from('profiles').select('role, client_id').eq('id', userId).maybeSingle()
    const profile = prof as { role: string; client_id: string | null } | null
    const isAdmin = profile?.role === 'admin'
    const isOwner = profile?.client_id === clientId
    if (!isAdmin && !isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    let sent = 0
    const body = excerpt ? String(excerpt).slice(0, 120) : ''

    if (kind === 'message') {
      if (from === 'admin') {
        // Notify the client
        sent = await sendPushToClient(clientId, {
          title: 'Nouveau message de ton copywriter',
          body: body || 'Tu as reçu un nouveau message.',
          url: `/portal/${clientId}`,
          tag: 'msg-' + clientId,
        })
      } else {
        // Client → notify admins
        sent = await sendPushToAdmins({
          title: `Nouveau message de ${clientData.name}`,
          body: body || 'Un client vient de t\'écrire.',
          url: `/clients/${clientId}`,
          tag: 'admin-msg-' + clientId,
        })
      }
    } else if (kind === 'post') {
      // Admin created a post for a client → notify the client
      sent = await sendPushToClient(clientId, {
        title: 'Un nouveau post est prêt',
        body: body || 'Ton copywriter a publié un nouveau post pour toi.',
        url: `/portal/${clientId}`,
        tag: 'post-' + clientId,
      })
    }

    return NextResponse.json({ ok: true, sent })
  } catch (e) {
    console.error('push notify', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
