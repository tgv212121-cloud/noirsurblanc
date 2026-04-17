'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { useToast } from '@/components/ui/Toast'
import { fetchClient, fetchClientPosts, fetchMetrics, fetchReminders, createPost, fetchOnboardingAnswers, uploadPostFile } from '@/lib/queries'
import type { PostFile } from '@/types'
import { formatNumber, formatDate, formatRelative, cn } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import PulseButton from '@/components/ui/PulseButton'
import GooeyNav from '@/components/ui/GooeyNavComponent'
import MessageThread from '@/components/messaging/MessageThread'
import type { Client, Post, PostMetrics, Reminder, PostStatus } from '@/types'
import { questions } from '@/components/onboarding/questions'

type Tab = 'calendar' | 'conversation' | 'stats' | 'onboarding'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { checking } = useAuthGuard({ requireRole: 'admin' })
  const toast = useToast()
  const [client, setClient] = useState<Client | null>(null)
  const [initialPosts, setInitialPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [newPost, setNewPost] = useState('')
  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [postImages, setPostImages] = useState<string[]>([])
  const [postFiles, setPostFiles] = useState<PostFile[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [savingPost, setSavingPost] = useState(false)
  const [postStatuses, setPostStatuses] = useState<Record<string, PostStatus>>({})
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<string | null>(null)

  // Calendar state (must be declared before any conditional return)
  const now = new Date()
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth())
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [onboardingAnswers, setOnboardingAnswers] = useState<Record<number, unknown>>({})

  useEffect(() => {
    Promise.all([
      fetchClient(id), fetchClientPosts(id), fetchMetrics(), fetchReminders(), fetchOnboardingAnswers(id),
    ]).then(([c, p, m, r, a]) => {
      setClient(c); setInitialPosts(p); setMetrics(m); setReminders(r.filter(x => x.clientId === id))
      setOnboardingAnswers(a); setLoading(false)
    })
  }, [id])

  const getPostStatus = useCallback((postId: string, originalStatus: PostStatus): PostStatus => {
    return postStatuses[postId] || originalStatus
  }, [postStatuses])

  const movePost = useCallback((postId: string, newStatus: PostStatus) => {
    setPostStatuses(prev => ({ ...prev, [postId]: newStatus }))
  }, [])

  if (checking || loading) {
    return (
      <div className="py-10">
        <p className="text-blanc-muted">Chargement...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="py-10">
        <p className="text-blanc-muted">Client introuvable.</p>
        <Link href="/clients" className="text-gold text-sm mt-2 inline-block">Retour</Link>
      </div>
    )
  }

  const clientPosts = initialPosts.filter(p => p.clientId === id).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const publishedPosts = clientPosts.filter(p => getPostStatus(p.id, p.status) === 'published')
  const pendingPosts = clientPosts.filter(p => getPostStatus(p.id, p.status) !== 'published')
  const totalImpressions = publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.impressions || 0) }, 0)
  const totalLikes = publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.likes || 0) }, 0)
  const avgEngagement = publishedPosts.length > 0
    ? (publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.engagementRate || 0) }, 0) / publishedPosts.length).toFixed(2)
    : '0'

  const clientReminders = reminders.filter(r => r.clientId === id).sort((a, b) => (b.lastSentAt || '').localeCompare(a.lastSentAt || ''))
  const messageThread = clientReminders.filter(r => r.lastSentAt).flatMap(r => {
    const msgs: { type: 'sent' | 'received'; text: string; date: string }[] = [{ type: 'sent', text: r.message, date: r.lastSentAt! }]
    if (r.response && r.lastResponseAt) msgs.push({ type: 'received', text: r.response, date: r.lastResponseAt })
    return msgs
  }).sort((a, b) => a.date.localeCompare(b.date))

  const TABS: { id: Tab; label: string }[] = [
    { id: 'calendar', label: 'Calendrier' },
    { id: 'conversation', label: 'Conversation' },
    { id: 'stats', label: 'Stats' },
    { id: 'onboarding', label: 'Onboarding' },
  ]

  // Calendar helpers
  const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear)
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear)
  const postsByDate: Record<string, typeof clientPosts> = {}
  clientPosts.forEach(p => { if (!postsByDate[p.publishedAt]) postsByDate[p.publishedAt] = []; postsByDate[p.publishedAt].push(p) })
  const prevMonth = () => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) } else setCalendarMonth(m => m - 1) }
  const nextMonth = () => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) } else setCalendarMonth(m => m + 1) }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-blanc-muted hover:text-gold transition-colors duration-200">← Clients</Link>
      </div>

      {/* Client header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-blanc">{client.name}</h1>
            </div>
            {client.company && <p className="text-base text-blanc-muted">{client.company}</p>}
          </div>
        </div>

        {/* Contact info */}
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-8" style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div><p className="text-xs text-blanc-muted mb-1">Client depuis</p><p className="text-sm text-blanc">{formatDate(client.onboardedAt)}</p></div>
          <div><p className="text-xs text-blanc-muted mb-1">LinkedIn</p>{client.linkedinUrl ? <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:text-gold-dark transition-colors duration-200">Voir le profil</a> : <p className="text-sm text-blanc-muted/50">Non renseigné</p>}</div>
        </div>
      </div>



      {/* Tabs */}
      <div className="mb-10">
        <GooeyNav
          items={TABS.map(t => ({ label: t.label }))}
          initialActiveIndex={0}
          particleCount={18}
          particleDistances={[70, 10]}
          particleR={80}
          animationTime={500}
          timeVariance={400}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          onActiveChange={(index) => setActiveTab(TABS[index].id)}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Calendar tab */}
        {activeTab === 'calendar' && (
          <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-[minmax(0,520px)_1fr] gap-8 items-start">
          <div>
            <div className="flex items-center justify-between mb-8">
              <button onClick={prevMonth} className="text-blanc-muted hover:text-blanc text-sm cursor-pointer" style={{ padding: '8px 16px' }}>← {MONTHS_FR[calendarMonth === 0 ? 11 : calendarMonth - 1]}</button>
              <h2 className="text-lg font-semibold text-blanc">{MONTHS_FR[calendarMonth]} {calendarYear}</h2>
              <button onClick={nextMonth} className="text-blanc-muted hover:text-blanc text-sm cursor-pointer" style={{ padding: '8px 16px' }}>{MONTHS_FR[calendarMonth === 11 ? 0 : calendarMonth + 1]} →</button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} className="text-center text-xs text-blanc-muted font-medium" style={{ padding: '8px 0' }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayPosts = postsByDate[dateStr] || []
                const isToday = dateStr === now.toISOString().split('T')[0]
                const isSelected = selectedDate === dateStr
                const hasPost = dayPosts.length > 0
                const isEditing = editingDate === dateStr
                return (
                  <button key={day} onClick={() => { setEditingDate(isEditing ? null : dateStr); setSelectedDate(isEditing ? null : dateStr); if (!hasPost) setNewPost('') }}
                    className={cn('relative rounded-xl text-sm cursor-pointer transition-all duration-200 text-center', (isSelected || isEditing) ? 'ring-2' : '', hasPost ? 'font-semibold' : 'text-blanc-muted')}
                    style={{ padding: '12px 0', backgroundColor: hasPost ? (dayPosts[0].status === 'published' ? '#05966910' : '#2563eb10') : isToday ? 'var(--noir-elevated)' : 'transparent', color: hasPost ? 'var(--blanc)' : undefined, ['--tw-ring-color' as string]: '#2563eb'}}>
                    {day}
                    {hasPost && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full" style={{ width: '5px', height: '5px', backgroundColor: dayPosts[0].status === 'published' ? '#059669' : '#2563eb' }} />}
                  </button>
                )
              })}
            </div>

          </div>

          {/* Right column: editor / post viewer */}
          <div className="lg:sticky lg:top-6">
            {!editingDate && (
              <div className="bg-noir-elevated rounded-xl text-center" style={{ padding: '60px 28px' }}>
                <p className="text-sm text-blanc-muted">Clique sur un jour pour rédiger ou voir un post.</p>
              </div>
            )}
            {editingDate && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-blanc">
                    {new Date(editingDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <button onClick={() => { setEditingDate(null); setSelectedDate(null) }} className="text-xs text-blanc-muted hover:text-blanc cursor-pointer">Fermer</button>
                </div>

                {/* If post exists for this date , show it */}
                {postsByDate[editingDate] ? (
                  postsByDate[editingDate].map(post => {
                    const m = metrics.find(mt => mt.postId === post.id)
                    return (
                      <div key={post.id} className="bg-noir-elevated rounded-xl" style={{ padding: '28px' }}>
                        <div className="flex items-center gap-3 mb-5">
                          <span className="text-[10px] font-medium uppercase tracking-wider rounded"
                            style={{ padding: '4px 10px', backgroundColor: post.status === 'published' ? '#05966912' : '#2563eb12', color: post.status === 'published' ? '#059669' : '#2563eb' }}>
                            {post.status === 'published' ? 'Publié' : 'Programmé'}
                          </span>
                        </div>
                        <p className="text-[15px] text-blanc leading-[1.9] whitespace-pre-line mb-6" style={{ maxWidth: '60ch' }}>{post.content}</p>
                        {post.files && post.files.length > 0 && (
                          <div className="flex flex-col gap-2 mb-6" style={{ maxWidth: '60ch' }}>
                            {post.files.map((f, i) => (
                              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-3 bg-noir-card rounded-lg hover:bg-noir-elevated transition-colors"
                                style={{ padding: '10px 14px' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-gold shrink-0">
                                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                </svg>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-blanc truncate">{f.name}</p>
                                  {typeof f.size === 'number' && <p className="text-[11px] text-blanc-muted/60">{formatBytes(f.size)}</p>}
                                </div>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blanc-muted shrink-0">
                                  <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
                                </svg>
                              </a>
                            ))}
                          </div>
                        )}
                        {m && (
                          <div className="grid grid-cols-4 gap-3">
                            <div className="bg-noir-card rounded-lg" style={{ padding: '12px 16px' }}><p className="text-[10px] text-blanc-muted mb-1">Impressions</p><p className="text-sm font-semibold text-blanc">{formatNumber(m.impressions)}</p></div>
                            <div className="bg-noir-card rounded-lg" style={{ padding: '12px 16px' }}><p className="text-[10px] text-blanc-muted mb-1">Likes</p><p className="text-sm font-semibold text-blanc">{m.likes}</p></div>
                            <div className="bg-noir-card rounded-lg" style={{ padding: '12px 16px' }}><p className="text-[10px] text-blanc-muted mb-1">Commentaires</p><p className="text-sm font-semibold text-blanc">{m.comments}</p></div>
                            <div className="bg-noir-card rounded-lg" style={{ padding: '12px 16px' }}><p className="text-[10px] text-blanc-muted mb-1">Engagement</p><p className="text-sm font-semibold text-gold">{m.engagementRate}%</p></div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  /* No post for this date , show editor */
                  <div className="bg-noir-elevated rounded-xl" style={{ padding: '28px' }}>
                    <h3 className="text-base font-semibold text-blanc mb-2">Rédiger un post</h3>
                    <p className="text-xs text-blanc-muted mb-5">
                      Ce post sera visible par {client.name.split(' ')[0]} dans son calendrier.
                    </p>
                    <textarea
                      value={newPost}
                      onChange={e => setNewPost(e.target.value)}
                      onInput={e => {
                        const el = e.currentTarget
                        el.style.height = 'auto'
                        el.style.height = el.scrollHeight + 'px'
                      }}
                      ref={(el) => {
                        if (el) {
                          el.style.height = 'auto'
                          el.style.height = Math.max(el.scrollHeight, 220) + 'px'
                        }
                      }}
                      placeholder="Écrivez le post LinkedIn ici..."
                      className="w-full bg-noir-card rounded-xl text-sm text-blanc placeholder:text-blanc-muted/50 outline-none leading-relaxed"
                      style={{ padding: '18px 22px', resize: 'none', minHeight: '220px', overflow: 'hidden' }}
                      autoFocus
                    />

                    {/* Photo upload */}
                    <div className="mt-5">
                      <p className="text-xs text-blanc-muted mb-3">Photos / Carrousel</p>

                      {/* Image previews */}
                      {postImages.length > 0 && (
                        <div className="flex gap-3 mb-4 flex-wrap">
                          {postImages.map((img, i) => (
                            <div key={i} className="relative group">
                              <img src={img} alt={`Image ${i + 1}`} className="rounded-lg object-cover" style={{ width: '120px', height: '120px' }} />
                              <button
                                onClick={() => setPostImages(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                style={{ backgroundColor: '#ef4444' }}
                              >
                                ×
                              </button>
                              <span className="absolute bottom-1 left-1 text-[10px] text-white font-medium rounded px-1.5 py-0.5" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                                {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload button */}
                      <label className="inline-flex items-center gap-2 text-sm text-blanc-muted hover:text-blanc cursor-pointer rounded-xl transition-colors duration-200" style={{ padding: '12px 20px', backgroundColor: 'var(--noir-card)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="18" x="3" y="3" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                        Ajouter des photos
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const files = e.target.files
                            if (!files) return
                            Array.from(files).forEach(file => {
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                if (ev.target?.result) {
                                  setPostImages(prev => [...prev, ev.target!.result as string])
                                }
                              }
                              reader.readAsDataURL(file)
                            })
                            e.target.value = ''
                          }}
                        />
                      </label>
                      {postImages.length > 0 && (
                        <span className="text-xs text-blanc-muted ml-3">{postImages.length} photo{postImages.length > 1 ? 's' : ''}</span>
                      )}
                    </div>

                    {/* Files */}
                    <div className="mt-6">
                      <p className="text-xs text-blanc-muted mb-3">Fichiers joints</p>

                      {postFiles.length > 0 && (
                        <div className="flex flex-col gap-2 mb-4">
                          {postFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 bg-noir-card rounded-lg group" style={{ padding: '10px 14px' }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-gold shrink-0">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                              </svg>
                              <div className="flex-1 min-w-0">
                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blanc hover:text-gold transition-colors truncate block">{f.name}</a>
                                {typeof f.size === 'number' && <p className="text-[11px] text-blanc-muted/60">{formatBytes(f.size)}</p>}
                              </div>
                              <button
                                onClick={() => setPostFiles(prev => prev.filter((_, idx) => idx !== i))}
                                className="text-blanc-muted/40 hover:text-red-400 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Retirer"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <label className="inline-flex items-center gap-2 text-sm text-blanc-muted hover:text-blanc cursor-pointer rounded-xl transition-colors duration-200" style={{ padding: '12px 20px', backgroundColor: 'var(--noir-card)' }}>
                        {uploadingFile ? (
                          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                          </svg>
                        )}
                        {uploadingFile ? 'Envoi...' : 'Ajouter un fichier'}
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            e.target.value = ''
                            if (!file) return
                            setUploadingFile(true)
                            const result = await uploadPostFile(file)
                            setUploadingFile(false)
                            if (!result) { toast.error("Erreur lors de l'upload du fichier."); return }
                            setPostFiles(prev => [...prev, result])
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-4 mt-6">
                      <PulseButton
                        onClick={async () => {
                          if (!newPost.trim() || !editingDate || savingPost) return
                          setSavingPost(true)
                          const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'p_' + Date.now()
                          const publishedAt = `${editingDate}T10:00:00.000Z`
                          const status: PostStatus = new Date(editingDate) > new Date() ? 'scheduled' : 'published'
                          const created = await createPost({
                            id: newId,
                            clientId: id,
                            content: newPost.trim(),
                            publishedAt,
                            status,
                            images: postImages,
                            files: postFiles,
                          })
                          setSavingPost(false)
                          if (!created) { toast.error("Erreur lors de l'enregistrement du post."); return }
                          const refreshed = await fetchClientPosts(id)
                          setInitialPosts(refreshed)
                          setEditingDate(null); setSelectedDate(null); setNewPost(''); setPostImages([]); setPostFiles([])
                        }}
                      >
                        {savingPost ? 'Enregistrement...' : 'Enregistrer'}
                      </PulseButton>
                      <button onClick={() => { setEditingDate(null); setSelectedDate(null); setNewPost(''); setPostImages([]); setPostFiles([]) }} className="text-sm text-blanc-muted hover:text-blanc transition-colors duration-200 cursor-pointer" style={{ padding: '14px 24px' }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
          </motion.div>
        )}

        {/* Conversation tab */}
        {activeTab === 'conversation' && (
          <motion.div key="conversation" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <MessageThread
              clientId={client.id}
              currentUser="admin"
              accentColor="#2563eb"
              otherUserName={client.name.split(' ')[0]}
              whatsappPhone={client.phone}
            />
          </motion.div>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="grid grid-cols-2 gap-5 mb-12">
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}><p className="text-blanc-muted text-xs mb-2">Impressions totales</p><p className="text-3xl font-bold text-blanc">{formatNumber(totalImpressions)}</p></div>
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}><p className="text-blanc-muted text-xs mb-2">Likes totaux</p><p className="text-3xl font-bold text-blanc">{formatNumber(totalLikes)}</p></div>
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}><p className="text-blanc-muted text-xs mb-2">Commentaires totaux</p><p className="text-3xl font-bold text-blanc">{formatNumber(publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.comments || 0) }, 0))}</p></div>
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}><p className="text-blanc-muted text-xs mb-2">Engagement moyen</p><p className="text-3xl font-bold text-gold">{avgEngagement}%</p></div>
            </div>

            <h2 className="text-base font-semibold text-blanc mb-6">Performance par post</h2>
            <div className="space-y-4">
              {[...publishedPosts].map(p => ({ ...p, m: metrics.find(mt => mt.postId === p.id) })).filter(p => p.m).sort((a, b) => (b.m!.impressions * b.m!.engagementRate) - (a.m!.impressions * a.m!.engagementRate)).map((post, i) => {
                const isOpen = expandedPost === post.id
                const firstLine = post.content.split('\n').filter(l => l.trim())[0] || ''
                return (
                  <div key={post.id}>
                    <button onClick={() => setExpandedPost(isOpen ? null : post.id)} className="w-full text-left bg-noir-elevated rounded-xl transition-all duration-200 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style={{ padding: '20px 24px' }}>
                      <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold" style={{ color: i === 0 ? '#2563eb' : 'var(--blanc-muted)', opacity: i === 0 ? 1 : 0.3 }}>{i + 1}</span>
                        <div className="flex-1 min-w-0"><p className="text-base text-blanc truncate">{firstLine}</p><p className="text-xs text-blanc-muted mt-1">{formatRelative(post.publishedAt)}</p></div>
                        <div className="text-right shrink-0"><p className="text-sm font-semibold text-blanc">{formatNumber(post.m!.impressions)}</p><p className="text-xs text-gold">{post.m!.engagementRate}%</p></div>
                      </div>
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                          <div className="bg-noir-light rounded-b-xl -mt-2" style={{ padding: '24px' }}>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                              <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}><p className="text-xs text-blanc-muted mb-1">Impressions</p><p className="text-lg font-bold text-blanc">{formatNumber(post.m!.impressions)}</p></div>
                              <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}><p className="text-xs text-blanc-muted mb-1">Likes</p><p className="text-lg font-bold text-blanc">{post.m!.likes}</p></div>
                              <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}><p className="text-xs text-blanc-muted mb-1">Commentaires</p><p className="text-lg font-bold text-blanc">{post.m!.comments}</p></div>
                              <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}><p className="text-xs text-blanc-muted mb-1">Engagement</p><p className="text-lg font-bold text-gold">{post.m!.engagementRate}%</p></div>
                            </div>
                            <p className="text-sm text-blanc leading-relaxed whitespace-pre-line">{post.content}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
        {/* Onboarding tab , questionnaire answers */}
        {activeTab === 'onboarding' && (
          <motion.div key="onboarding" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <div className="mb-8">
              <h2 className="text-base font-semibold text-blanc mb-2">Réponses d&apos;onboarding</h2>
              <p className="text-xs text-blanc-muted">Les réponses de {client.name.split(' ')[0]} au questionnaire initial.</p>
            </div>

            <div className="space-y-6">
              {questions.map((q, i) => {
                const raw = onboardingAnswers[q.id]
                const objAnswer = (raw && typeof raw === 'object') ? raw as Record<string, string> : null
                const strAnswer = typeof raw === 'string' ? raw : null
                return (
                <div key={q.id} className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}>
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-medium text-blanc-muted shrink-0" style={{ padding: '4px 10px', backgroundColor: 'var(--noir-card)', borderRadius: '6px', marginTop: '2px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blanc mb-3">{q.question}</p>
                      {q.subtitle && <p className="text-xs text-blanc-muted mb-3">{q.subtitle}</p>}

                      {q.type === 'multi-input' && q.fields ? (
                        <div className="space-y-2">
                          {q.fields.map((field, fi) => {
                            const v = objAnswer?.[fi as unknown as string] ?? objAnswer?.[String(fi)]
                            return (
                            <div key={fi} className="flex items-center gap-3">
                              <span className="text-xs text-gold font-medium" style={{ width: '60px' }}>{field.label}</span>
                              <div className="flex-1 bg-noir-card rounded-lg" style={{ padding: '10px 14px' }}>
                                {v && v.trim() ? (
                                  <p className="text-sm text-blanc whitespace-pre-line">{v}</p>
                                ) : (
                                  <p className="text-sm text-blanc-muted italic">Non renseigné</p>
                                )}
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      ) : q.type === 'triple-input' && q.fields ? (
                        <div className="space-y-2">
                          {q.fields.map((field, fi) => {
                            const v = objAnswer?.[fi as unknown as string] ?? objAnswer?.[String(fi)]
                            return (
                            <div key={fi} className="flex items-center gap-3">
                              <span className="text-xs font-medium flex items-center justify-center rounded-lg" style={{ width: '28px', height: '28px', backgroundColor: 'var(--noir-card)', color: 'var(--gold)' }}>{fi + 1}</span>
                              <div className="flex-1 bg-noir-card rounded-lg" style={{ padding: '10px 14px' }}>
                                {v && v.trim() ? (
                                  <p className="text-sm text-blanc whitespace-pre-line">{v}</p>
                                ) : (
                                  <p className="text-sm text-blanc-muted italic">Non renseigné</p>
                                )}
                              </div>
                            </div>
                            )
                          })}
                        </div>
                      ) : (
                        <div className="bg-noir-card rounded-lg" style={{ padding: '14px 18px' }}>
                          {strAnswer && strAnswer.trim() ? (
                            <p className="text-sm text-blanc whitespace-pre-line leading-relaxed">{strAnswer}</p>
                          ) : (
                            <p className="text-sm text-blanc-muted italic">Non renseigné</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
