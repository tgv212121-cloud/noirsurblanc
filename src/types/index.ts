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

export type PostFile = { name: string; url: string; size?: number }

export type Post = {
  id: string
  clientId: string
  content: string
  publishedAt: string
  status: PostStatus
  linkedinUrl?: string
  files?: PostFile[]
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

export type AvailabilityRule = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  slotDurationMin: number
  enabled: boolean
}

export type Appointment = {
  id: string
  clientId: string
  scheduledAt: string
  durationMin: number
  status: 'confirmed' | 'cancelled'
  topic?: string
  notes?: string
  meetingUrl?: string
  createdAt: string
}
