// Google Calendar helpers - server-side only.
import { getAdminSupabase } from './supabase-admin'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const CAL_API = 'https://www.googleapis.com/calendar/v3'
const USERINFO = 'https://www.googleapis.com/oauth2/v3/userinfo'

export function getRedirectUri(origin: string) {
  return `${origin}/api/google/callback`
}

export function buildAuthUrl(origin: string, state?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID missing')
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getRedirectUri(origin),
    response_type: 'code',
    scope: 'openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  })
  if (state) params.set('state', state)
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCode(origin: string, code: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(origin),
      grant_type: 'authorization_code',
      code,
    }),
  })
  if (!res.ok) throw new Error('Token exchange failed: ' + (await res.text()))
  return (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
    token_type: string
    id_token?: string
  }
}

export async function fetchUserInfo(accessToken: string) {
  const res = await fetch(USERINFO, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('userinfo failed: ' + (await res.text()))
  return (await res.json()) as { email: string; sub: string; name?: string }
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error('refresh failed: ' + (await res.text()))
  return (await res.json()) as { access_token: string; expires_in: number; scope: string; token_type: string }
}

type TokenRow = {
  id: string
  email: string
  access_token: string
  refresh_token: string
  expires_at: string
  calendar_id: string
}

// Returns the stored primary Google token, refreshed if needed. null if nobody connected.
export async function getPrimaryToken(): Promise<TokenRow | null> {
  const sb = getAdminSupabase()
  const { data } = await sb.from('google_tokens').select('*').eq('is_primary', true).maybeSingle()
  if (!data) return null
  const row = data as TokenRow
  const now = Date.now()
  const exp = new Date(row.expires_at).getTime()
  if (exp - now > 60_000) return row // still valid for >1min
  // Refresh
  try {
    const refreshed = await refreshAccessToken(row.refresh_token)
    const newExp = new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
    await sb.from('google_tokens').update({
      access_token: refreshed.access_token,
      expires_at: newExp,
      updated_at: new Date().toISOString(),
    }).eq('id', row.id)
    return { ...row, access_token: refreshed.access_token, expires_at: newExp }
  } catch (e) {
    console.error('token refresh failed', e)
    return null
  }
}

// Query Google Calendar for busy intervals in [timeMin, timeMax] (ISO strings).
export async function getBusySlots(timeMin: string, timeMax: string): Promise<{ start: string; end: string }[]> {
  const token = await getPrimaryToken()
  if (!token) return []
  const res = await fetch(`${CAL_API}/freeBusy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: 'Europe/Paris',
      items: [{ id: token.calendar_id || 'primary' }],
    }),
  })
  if (!res.ok) {
    console.error('freeBusy error', await res.text())
    return []
  }
  const data = await res.json()
  const cal = data.calendars?.[token.calendar_id || 'primary']
  return cal?.busy || []
}

// Create a Google Calendar event for a booking. Returns eventId + hangoutLink.
export async function createCalendarEvent(params: {
  title: string
  description?: string
  startIso: string
  endIso: string
  attendeeEmail?: string
}): Promise<{ id: string; hangoutLink?: string } | null> {
  const token = await getPrimaryToken()
  if (!token) return null
  const body: Record<string, unknown> = {
    summary: params.title,
    description: params.description || '',
    start: { dateTime: params.startIso, timeZone: 'Europe/Paris' },
    end: { dateTime: params.endIso, timeZone: 'Europe/Paris' },
    conferenceData: {
      createRequest: {
        requestId: `noirsurblanc-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }
  if (params.attendeeEmail) {
    body.attendees = [{ email: params.attendeeEmail }]
  }
  const res = await fetch(
    `${CAL_API}/calendars/${encodeURIComponent(token.calendar_id || 'primary')}/events?conferenceDataVersion=1&sendUpdates=none`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) {
    console.error('create event failed', await res.text())
    return null
  }
  const data = await res.json()
  return { id: data.id, hangoutLink: data.hangoutLink }
}

// Delete a Google Calendar event by ID
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  const token = await getPrimaryToken()
  if (!token || !eventId) return false
  const res = await fetch(
    `${CAL_API}/calendars/${encodeURIComponent(token.calendar_id || 'primary')}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.access_token}` },
    },
  )
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    console.error('delete event failed', res.status, await res.text())
    return false
  }
  return true
}

// Revoke the stored token + delete from DB
export async function disconnectPrimary(): Promise<boolean> {
  const sb = getAdminSupabase()
  const { data } = await sb.from('google_tokens').select('id, refresh_token').eq('is_primary', true).maybeSingle()
  if (!data) return true
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent((data as { refresh_token: string }).refresh_token)}`, { method: 'POST' })
  } catch (e) { console.error('revoke', e) }
  await sb.from('google_tokens').delete().eq('id', (data as { id: string }).id)
  return true
}
