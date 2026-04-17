// Server-side web push helper (uses web-push + VAPID).
// Only import from API routes / server code.
import webpush from 'web-push'
import { getAdminSupabase } from './supabase-admin'

let configured = false
function configure() {
  if (configured) return
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:hello@noirsurblanc.studio'
  if (!pub || !priv) throw new Error('VAPID keys missing on server')
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
}

type PushPayload = { title: string; body: string; url?: string; tag?: string }

// Send push to every subscription of a given auth user.
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!userId) return 0
  try { configure() } catch (e) { console.warn('push not configured', (e as Error).message); return 0 }

  const sb = getAdminSupabase()
  const { data } = await sb.from('push_subscriptions').select('*').eq('user_id', userId)
  const subs = (data || []) as { id: string; endpoint: string; p256dh: string; auth: string }[]
  if (subs.length === 0) return 0

  const message = JSON.stringify(payload)
  let sent = 0

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          message,
        )
        sent++
      } catch (e: unknown) {
        const err = e as { statusCode?: number }
        // 410 Gone = subscription expired, delete it
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await sb.from('push_subscriptions').delete().eq('id', s.id)
        } else {
          console.error('push send error', err)
        }
      }
    }),
  )
  return sent
}

// Send to all admins
export async function sendPushToAdmins(payload: PushPayload): Promise<number> {
  const sb = getAdminSupabase()
  const { data: admins } = await sb.from('profiles').select('id').eq('role', 'admin')
  const ids = (admins || []).map((a: { id: string }) => a.id)
  if (ids.length === 0) return 0
  const counts = await Promise.all(ids.map((id) => sendPushToUser(id, payload)))
  return counts.reduce((a, b) => a + b, 0)
}

// Given a client_id, find the linked auth user and send push
export async function sendPushToClient(clientId: string, payload: PushPayload): Promise<number> {
  if (!clientId) return 0
  const sb = getAdminSupabase()
  const { data } = await sb.from('clients').select('auth_user_id').eq('id', clientId).maybeSingle()
  const userId = (data as { auth_user_id: string | null } | null)?.auth_user_id
  if (!userId) return 0
  return sendPushToUser(userId, payload)
}
