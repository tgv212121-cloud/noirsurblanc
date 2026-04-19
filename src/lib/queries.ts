import { supabase } from './supabase'
import type { Client, Post, PostMetrics, Reminder } from '@/types'

// ============================================================
// CLIENTS
// ============================================================

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('onboarded_at', { ascending: false })

  if (error) { console.error('fetchClients', error); return [] }
  return (data || []).map(mapClient)
}

export async function fetchClient(id: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) { console.error('fetchClient', error); return null }
  return data ? mapClient(data) : null
}

export async function exportAllData(): Promise<{
  exportedAt: string
  clients: unknown[]
  posts: unknown[]
  metrics: unknown[]
  reminders: unknown[]
  messages: unknown[]
  onboarding_answers: unknown[]
  profiles: unknown[]
}> {
  const [clients, posts, metrics, reminders, messages, onboarding, profiles] = await Promise.all([
    supabase.from('clients').select('*'),
    supabase.from('posts').select('*'),
    supabase.from('metrics').select('*'),
    supabase.from('reminders').select('*'),
    supabase.from('messages').select('*'),
    supabase.from('onboarding_answers').select('*'),
    supabase.from('profiles').select('*'),
  ])
  return {
    exportedAt: new Date().toISOString(),
    clients: clients.data || [],
    posts: posts.data || [],
    metrics: metrics.data || [],
    reminders: reminders.data || [],
    messages: messages.data || [],
    onboarding_answers: onboarding.data || [],
    profiles: profiles.data || [],
  }
}

export async function deleteClient(id: string): Promise<boolean> {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) { console.error('deleteClient', error); return false }
  return true
}

export async function createClient(input: {
  name: string
  company: string
  email: string
  phone?: string
}): Promise<Client | null> {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'c_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const { data, error } = await supabase
    .from('clients')
    .insert({
      id,
      name: input.name,
      company: input.company || '',
      avatar: '',
      email: input.email,
      phone: input.phone || '',
      status: 'onboarding',
      onboarded_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) { console.error('createClient', error); return null }
  return data ? mapClient(data) : null
}

function mapClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    avatar: row.avatar,
    email: row.email,
    phone: row.phone,
    status: row.status,
    onboardedAt: row.onboarded_at,
    linkedinUrl: row.linkedin_url,
    lastSeenAt: row.last_seen_at || null,
  }
}

// ============================================================
// POSTS
// ============================================================

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('published_at', { ascending: false })

  if (error) { console.error('fetchPosts', error); return [] }
  return (data || []).map(mapPost)
}

export async function fetchClientPosts(clientId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('client_id', clientId)
    .order('published_at', { ascending: false })

  if (error) { console.error('fetchClientPosts', error); return [] }
  return (data || []).map(mapPost)
}

export async function createPost(post: {
  id: string
  clientId: string
  content: string
  publishedAt: string
  status: 'draft' | 'scheduled' | 'published'
  images?: string[]
  files?: { name: string; url: string; size?: number }[]
}): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      id: post.id,
      client_id: post.clientId,
      content: post.content,
      published_at: post.publishedAt,
      status: post.status,
      images: post.images || [],
      files: post.files || [],
    })
    .select()
    .single()

  if (error) { console.error('createPost', error); return null }

  // Notif email au client (nouveau post a valider), cooldown 30 min
  try {
    const preview = post.content ? post.content.slice(0, 180) : 'Un nouveau post est prêt à être validé.'
    fetch('/api/notify/new-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: post.clientId, preview }),
    }).catch(() => {})
  } catch {}

  return data ? mapPost(data) : null
}

export async function updatePostStatus(postId: string, status: 'draft' | 'scheduled' | 'published'): Promise<boolean> {
  const { error } = await supabase
    .from('posts')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', postId)

  if (error) { console.error('updatePostStatus', error); return false }
  return true
}

function mapPost(row: any): Post {
  return {
    id: row.id,
    clientId: row.client_id,
    content: row.content,
    publishedAt: row.published_at,
    status: row.status,
    linkedinUrl: row.linkedin_url,
    files: Array.isArray(row.files) ? row.files : [],
  }
}

// ============================================================
// METRICS
// ============================================================

export async function fetchMetrics(): Promise<PostMetrics[]> {
  const { data, error } = await supabase
    .from('metrics')
    .select('*')

  if (error) { console.error('fetchMetrics', error); return [] }
  return (data || []).map(mapMetric)
}

function mapMetric(row: any): PostMetrics {
  return {
    postId: row.post_id,
    impressions: row.impressions,
    likes: row.likes,
    comments: row.comments,
    reposts: row.reposts,
    engagementRate: Number(row.engagement_rate),
    capturedAt: row.captured_at,
  }
}

// ============================================================
// REMINDERS
// ============================================================

export async function fetchReminders(): Promise<Reminder[]> {
  const { data, error } = await supabase
    .from('reminders')
    .select('*')

  if (error) { console.error('fetchReminders', error); return [] }
  return (data || []).map(mapReminder)
}

function mapReminder(row: any): Reminder {
  return {
    id: row.id,
    clientId: row.client_id,
    frequency: row.frequency,
    dayOfWeek: row.day_of_week,
    time: row.time,
    message: row.message,
    status: row.status,
    lastSentAt: row.last_sent_at,
    lastResponseAt: row.last_response_at,
    response: row.response,
  }
}

// ============================================================
// MESSAGES
// ============================================================

export type Message = {
  id: string
  clientId: string
  sender: 'admin' | 'client'
  text: string | null
  fileUrl: string | null
  voiceUrl: string | null
  createdAt: string
  editedAt?: string | null
  readAt?: string | null
  replyToId?: string | null
}

export async function fetchMessages(clientId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) { console.error('fetchMessages', error); return [] }
  return (data || []).map((row: any) => ({
    id: row.id,
    clientId: row.client_id,
    sender: row.sender,
    text: row.text,
    fileUrl: row.file_url,
    voiceUrl: row.voice_url,
    createdAt: row.created_at,
    editedAt: row.edited_at || null,
    readAt: row.read_at || null,
    replyToId: row.reply_to_id || null,
  }))
}

// Recupere le last_seen_at le plus recent parmi les profils admin.
// Utile sur l'espace client pour afficher "Enzo · En ligne / il y a X".
export async function fetchAdminLastSeen(): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('last_seen_at')
    .eq('role', 'admin')
    .order('last_seen_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  if (error || !data) return null
  return (data as { last_seen_at?: string | null }).last_seen_at || null
}

// Marque comme lus tous les messages dont je ne suis PAS l'auteur (cad envoyes par l'autre partie)
export async function markMessagesAsRead(clientId: string, viewer: 'admin' | 'client'): Promise<number> {
  const otherSender = viewer === 'admin' ? 'client' : 'admin'
  const { count, error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() }, { count: 'exact' })
    .eq('client_id', clientId)
    .eq('sender', otherSender)
    .is('read_at', null)
  if (error) { console.error('markMessagesAsRead', error); return 0 }
  return count || 0
}

export async function updateMessage(id: string, newText: string): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .update({ text: newText, edited_at: new Date().toISOString() })
    .eq('id', id)
  if (error) { console.error('updateMessage', error); return false }
  return true
}

export async function deleteMessage(id: string): Promise<boolean> {
  const { error } = await supabase.from('messages').delete().eq('id', id)
  if (error) { console.error('deleteMessage', error); return false }
  return true
}

export async function sendMessage(message: {
  clientId: string
  sender: 'admin' | 'client'
  text?: string
  fileUrl?: string
  voiceUrl?: string
  replyToId?: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .insert({
      client_id: message.clientId,
      sender: message.sender,
      text: message.text || null,
      file_url: message.fileUrl || null,
      voice_url: message.voiceUrl || null,
      reply_to_id: message.replyToId || null,
    })

  if (error) { console.error('sendMessage', error); return false }

  // Notif email dans les 2 sens :
  // - client -> admin (Enzo recoit un mail avec lien vers la conversation)
  // - admin -> client (le client recoit un mail l'invitant a ouvrir son portail)
  try {
    const preview = message.text || (message.voiceUrl ? '🎤 Message vocal' : message.fileUrl ? '📎 Fichier joint' : '')
    fetch('/api/notify/new-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: message.clientId, sender: message.sender, preview }),
    }).catch(() => {}) // fire-and-forget, ne bloque pas l'UX
  } catch {}

  return true
}

// ============================================================
// ONBOARDING
// ============================================================

export async function fetchOnboardingAnswers(clientId: string): Promise<Record<number, any>> {
  const { data, error } = await supabase
    .from('onboarding_answers')
    .select('question_id, answer')
    .eq('client_id', clientId)

  if (error) { console.error('fetchOnboardingAnswers', error); return {} }
  const result: Record<number, any> = {}
  ;(data || []).forEach((row: any) => { result[row.question_id] = row.answer })
  return result
}

export async function saveOnboardingAnswer(clientId: string, questionId: number, answer: any): Promise<boolean> {
  const { error } = await supabase
    .from('onboarding_answers')
    .upsert({ client_id: clientId, question_id: questionId, answer }, { onConflict: 'client_id,question_id' })

  if (error) { console.error('saveOnboardingAnswer', error); return false }
  return true
}

// ============================================================
// STORAGE (images & fichiers)
// ============================================================

export async function uploadPostImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('post-images')
    .upload(fileName, file)

  if (error) { console.error('uploadPostImage', error); return null }

  const { data } = supabase.storage.from('post-images').getPublicUrl(fileName)
  return data.publicUrl
}

export async function uploadPostFile(file: File): Promise<{ name: string; url: string; size: number } | null> {
  const ext = file.name.split('.').pop()
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('message-files').upload(safeName, file)
  if (error) { console.error('uploadPostFile', error); return null }
  const { data } = supabase.storage.from('message-files').getPublicUrl(safeName)
  return { name: file.name, url: data.publicUrl, size: file.size }
}

export async function uploadMessageFile(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage
    .from('message-files')
    .upload(fileName, file)

  if (error) { console.error('uploadMessageFile', error); return null }

  const { data } = supabase.storage.from('message-files').getPublicUrl(fileName)
  return data.publicUrl
}

// ============================================================
// APPOINTMENTS
// ============================================================

export async function fetchAvailabilityRules(): Promise<import('@/types').AvailabilityRule[]> {
  const { data, error } = await supabase.from('availability_rules').select('*').order('day_of_week').order('start_time')
  if (error) { console.error('fetchAvailabilityRules', error); return [] }
  return (data || []).map((r: { id: string; day_of_week: number; start_time: string; end_time: string; slot_duration_min: number; enabled: boolean }) => ({
    id: r.id, dayOfWeek: r.day_of_week, startTime: r.start_time, endTime: r.end_time,
    slotDurationMin: r.slot_duration_min, enabled: r.enabled,
  }))
}

export async function upsertAvailabilityRule(rule: {
  id?: string; dayOfWeek: number; startTime: string; endTime: string; slotDurationMin: number; enabled: boolean
}): Promise<boolean> {
  const payload: Record<string, unknown> = {
    day_of_week: rule.dayOfWeek, start_time: rule.startTime, end_time: rule.endTime,
    slot_duration_min: rule.slotDurationMin, enabled: rule.enabled,
  }
  if (rule.id) payload.id = rule.id
  const { error } = await supabase.from('availability_rules').upsert(payload).select().single()
  if (error) { console.error('upsertAvailabilityRule', error); return false }
  return true
}

export async function deleteAvailabilityRule(id: string): Promise<boolean> {
  const { error } = await supabase.from('availability_rules').delete().eq('id', id)
  if (error) { console.error('deleteAvailabilityRule', error); return false }
  return true
}

export async function fetchAppointments(params?: { clientId?: string; fromIso?: string }): Promise<import('@/types').Appointment[]> {
  let q = supabase.from('appointments').select('*').eq('status', 'confirmed').order('scheduled_at')
  if (params?.clientId) q = q.eq('client_id', params.clientId)
  if (params?.fromIso) q = q.gte('scheduled_at', params.fromIso)
  const { data, error } = await q
  if (error) { console.error('fetchAppointments', error); return [] }
  return (data || []).map(mapAppointment)
}

function mapAppointment(r: {
  id: string; client_id: string | null; scheduled_at: string; duration_min: number;
  status: 'confirmed'|'cancelled'; topic?: string; notes?: string; meeting_url?: string;
  created_at: string; prospect_name?: string | null; prospect_email?: string | null; prospect_company?: string | null;
}): import('@/types').Appointment {
  return {
    id: r.id, clientId: r.client_id, scheduledAt: r.scheduled_at, durationMin: r.duration_min,
    status: r.status, topic: r.topic, notes: r.notes, meetingUrl: r.meeting_url, createdAt: r.created_at,
    prospectName: r.prospect_name || null,
    prospectEmail: r.prospect_email || null,
    prospectCompany: r.prospect_company || null,
  }
}

export async function createAppointment(input: {
  clientId?: string | null
  scheduledAt: string
  durationMin: number
  topic?: string
  notes?: string
  prospectName?: string
  prospectEmail?: string
  prospectCompany?: string
}): Promise<import('@/types').Appointment | null> {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'a_' + Date.now()
  const meetingUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/rdv/${id}`
  const payload: Record<string, unknown> = {
    id,
    client_id: input.clientId || null,
    scheduled_at: input.scheduledAt,
    duration_min: input.durationMin,
    status: 'confirmed',
    topic: input.topic || null,
    notes: input.notes || null,
    meeting_url: meetingUrl,
  }
  if (input.prospectName) payload.prospect_name = input.prospectName
  if (input.prospectEmail) payload.prospect_email = input.prospectEmail
  if (input.prospectCompany) payload.prospect_company = input.prospectCompany

  const { data, error } = await supabase.from('appointments').insert(payload).select().single()
  if (error) { console.error('createAppointment', error); return null }
  return data ? mapAppointment(data) : null
}

export async function cancelAppointment(id: string, opts?: { byAdmin?: boolean }): Promise<boolean> {
  try {
    const res = await fetch('/api/appointments/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, cancelledByAdmin: opts?.byAdmin !== false }),
    })
    if (!res.ok) {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id)
      if (error) { console.error('cancelAppointment fallback', error); return false }
    }
    return true
  } catch (e) {
    console.error('cancelAppointment', e)
    return false
  }
}

// ============================================================
// NOTIFICATION EMAILS (pour les notifs de RDV, invitations, etc.)
// ============================================================

export type NotificationEmail = { id: string; email: string; label: string | null; createdAt: string }

export async function fetchNotificationEmails(): Promise<NotificationEmail[]> {
  const { data, error } = await supabase.from('notification_emails').select('*').order('created_at', { ascending: true })
  if (error) { console.error('fetchNotificationEmails', error); return [] }
  return (data || []).map((r: { id: string; email: string; label: string | null; created_at: string }) => ({
    id: r.id, email: r.email, label: r.label, createdAt: r.created_at,
  }))
}

export async function addNotificationEmail(email: string, label?: string): Promise<boolean> {
  const { error } = await supabase.from('notification_emails').insert({ email: email.trim(), label: label?.trim() || null })
  if (error) { console.error('addNotificationEmail', error); return false }
  return true
}

export async function deleteNotificationEmail(id: string): Promise<boolean> {
  const { error } = await supabase.from('notification_emails').delete().eq('id', id)
  if (error) { console.error('deleteNotificationEmail', error); return false }
  return true
}
