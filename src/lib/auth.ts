'use client'

import { supabase } from './supabase'
import { IS_DEMO_MODE } from './demo/config'

export type Role = 'admin' | 'client'

export type Profile = {
  id: string
  email: string | null
  role: Role
  clientId: string | null
}

// En mode demo : auth simulee via sessionStorage. Pas de Supabase auth.
const DEMO_AUTH_KEY = 'nsb-demo-auth'

function getDemoAuth(): Profile | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DEMO_AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setDemoAuth(p: Profile | null) {
  if (typeof window === 'undefined') return
  if (p) sessionStorage.setItem(DEMO_AUTH_KEY, JSON.stringify(p))
  else sessionStorage.removeItem(DEMO_AUTH_KEY)
}

export async function signUp(email: string, password: string, opts: { role: Role; clientId?: string | null }) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error || !data.user) return { error: error?.message || 'Inscription échouée', user: null }
  // Create profile row
  const { error: pErr } = await supabase.from('profiles').insert({
    id: data.user.id,
    email,
    role: opts.role,
    client_id: opts.clientId || null,
  })
  if (pErr) console.error('profile insert', pErr)
  // Link client to auth_user_id
  if (opts.clientId) {
    await supabase.from('clients').update({ auth_user_id: data.user.id }).eq('id', opts.clientId)
  }
  return { error: null, user: data.user }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user) return { error: error?.message || 'Connexion échouée', user: null }
  return { error: null, user: data.user }
}

export async function signOut() {
  if (IS_DEMO_MODE) { setDemoAuth(null); return }
  await supabase.auth.signOut()
}

export async function sendResetEmail(email: string) {
  const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { error: error?.message || null }
}

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  return { error: error?.message || null }
}

export async function getSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getMyProfile(): Promise<Profile | null> {
  if (IS_DEMO_MODE) return getDemoAuth()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (data) {
    return { id: data.id, email: data.email, role: data.role, clientId: data.client_id }
  }
  // Auto-create a default 'client' profile if missing. Try to find a linked client by auth_user_id.
  const { data: linkedClient } = await supabase.from('clients').select('id').eq('auth_user_id', user.id).maybeSingle()
  const { data: created } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    role: 'client',
    client_id: linkedClient?.id || null,
  }).select().single()
  if (!created) return null
  return { id: created.id, email: created.email, role: created.role, clientId: created.client_id }
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((d: { id: string; email: string | null; role: Role; client_id: string | null }) => ({
    id: d.id, email: d.email, role: d.role, clientId: d.client_id,
  }))
}
