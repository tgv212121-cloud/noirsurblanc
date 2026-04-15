'use client'

import { supabase } from './supabase'

export type Role = 'admin' | 'client'

export type Profile = {
  id: string
  email: string | null
  role: Role
  clientId: string | null
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (error || !data) return null
  return { id: data.id, email: data.email, role: data.role, clientId: data.client_id }
}

export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((d: { id: string; email: string | null; role: Role; client_id: string | null }) => ({
    id: d.id, email: d.email, role: d.role, clientId: d.client_id,
  }))
}
