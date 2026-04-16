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
  }))
}

export async function sendMessage(message: {
  clientId: string
  sender: 'admin' | 'client'
  text?: string
  fileUrl?: string
  voiceUrl?: string
}): Promise<boolean> {
  const { error } = await supabase
    .from('messages')
    .insert({
      client_id: message.clientId,
      sender: message.sender,
      text: message.text || null,
      file_url: message.fileUrl || null,
      voice_url: message.voiceUrl || null,
    })

  if (error) { console.error('sendMessage', error); return false }
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
