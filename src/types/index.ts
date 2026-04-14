export type ClientStatus = 'active' | 'onboarding' | 'paused'

export type Client = {
  id: string
  name: string
  company: string
  avatar: string
  email: string
  phone: string
  status: ClientStatus
  onboardedAt: string
  linkedinUrl: string
}

export type PostStatus = 'draft' | 'published' | 'scheduled'

export type Post = {
  id: string
  clientId: string
  content: string
  publishedAt: string
  status: PostStatus
  linkedinUrl?: string
}

export type PostMetrics = {
  postId: string
  impressions: number
  likes: number
  comments: number
  reposts: number
  engagementRate: number
  capturedAt: string
}

export type ReminderFrequency = 'weekly' | 'biweekly'
export type ReminderStatus = 'scheduled' | 'sent' | 'responded'

export type Reminder = {
  id: string
  clientId: string
  frequency: ReminderFrequency
  dayOfWeek: number
  time: string
  message: string
  status: ReminderStatus
  lastSentAt?: string
  lastResponseAt?: string
  response?: string
}
