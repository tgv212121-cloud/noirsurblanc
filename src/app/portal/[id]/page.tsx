'use client'

import { use, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { signOut } from '@/lib/auth'
import { fetchClient, fetchClientPosts, fetchMetrics, fetchReminders, fetchAdminLastSeen } from '@/lib/queries'
import { formatNumber, formatRelative, cn } from '@/lib/utils'
import type { Client, Post, PostMetrics, Reminder } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import SliderTabs from '@/components/ui/SliderTabs'
import MessageThread from '@/components/messaging/MessageThread'
import NotificationPrompt from '@/components/ui/NotificationPrompt'
import ChangePasswordCard from '@/components/ui/ChangePasswordCard'
import GoogleCalendarCard from '@/components/ui/GoogleCalendarCard'
import NotificationsSettingsCard from '@/components/ui/NotificationsSettingsCard'
import BookingTab from '@/components/booking/BookingTab'
import MagicCard from '@/components/ui/MagicCard'
import NumberTicker from '@/components/ui/NumberTicker'
import VersionedPostView from '@/components/posts/VersionedPostView'

type Tab = 'calendar' | 'messages' | 'stats' | 'history' | 'booking' | 'account'

export default function ClientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { checking } = useAuthGuard({ requireClientId: id })
  const [client, setClient] = useState<Client | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') as Tab | null
  const validTabs: Tab[] = ['calendar', 'messages', 'stats', 'history', 'booking', 'account']
  const initialTab: Tab = urlTab && validTabs.includes(urlTab) ? urlTab : 'calendar'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [expandedPost, setExpandedPost] = useState<string | null>(null)

  // Sync tab with URL so refresh keeps it
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (activeTab === 'calendar') url.searchParams.delete('tab')
    else url.searchParams.set('tab', activeTab)
    const next = url.pathname + (url.search ? url.search : '')
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, '', next)
    }
  }, [activeTab])

  const [adminLastSeen, setAdminLastSeen] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetchClient(id), fetchClientPosts(id), fetchMetrics(), fetchReminders()]).then(([c, p, m, r]) => {
      setClient(c); setPosts(p); setMetrics(m); setReminders(r.filter(x => x.clientId === id)); setLoading(false)
    })
  }, [id])

  // Refetch admin last seen every 30s pour tenir la pastille a jour
  useEffect(() => {
    let mounted = true
    const fetchSeen = async () => {
      const v = await fetchAdminLastSeen()
      if (mounted) setAdminLastSeen(v)
    }
    fetchSeen()
    const int = setInterval(fetchSeen, 30_000)
    return () => { mounted = false; clearInterval(int) }
  }, [])

  // Ping presence : met à jour clients.last_seen_at à chaque chargement + toutes les 60s pendant la session
  useEffect(() => {
    if (!id) return
    const ping = () => {
      fetch('/api/presence/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id }),
      }).catch(() => {})
    }
    ping()
    const interval = setInterval(ping, 60_000)
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
  }, [id])

  // Calendar state (must be before any conditional return)
  const now = new Date()
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth())
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  if (checking || loading) {
    return (
      <div className="py-20 text-center">
        <p className="text-blanc-muted text-lg">Chargement...</p>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="text-blanc-muted text-lg">Espace introuvable.</p>
      </div>
    )
  }

  const clientPosts = posts
    .filter(p => p.clientId === id)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const nowDate = new Date()
  // "Posts publiés" = status=published OU date passee OU valide par le client
  const publishedPosts = clientPosts.filter(p => p.status === 'published' || new Date(p.publishedAt) <= nowDate || !!p.validatedAt)
  // "En attente" (compteur stats) = pas encore valide ET date future ET pas deja publie
  const pendingPosts = clientPosts.filter(p => p.status !== 'published' && new Date(p.publishedAt) > nowDate && !p.validatedAt)
  // "Programmés" (onglet Historique) = tous les posts pas encore publies (date future), valides ou non
  const scheduledPosts = clientPosts.filter(p => p.status !== 'published' && new Date(p.publishedAt) > nowDate)

  const clientReminders = reminders.filter(r => r.clientId === id).sort((a, b) => (b.lastSentAt || '').localeCompare(a.lastSentAt || ''))
  const messageThread = clientReminders.filter(r => r.lastSentAt).flatMap(r => {
    const msgs: { type: 'sent' | 'received'; text: string; date: string }[] = []
    if (r.response && r.lastResponseAt) msgs.push({ type: 'sent', text: r.response, date: r.lastResponseAt })
    msgs.push({ type: 'received', text: r.message, date: r.lastSentAt! })
    return msgs
  }).sort((a, b) => a.date.localeCompare(b.date))

  const TABS: { id: Tab; label: string }[] = [
    { id: 'calendar', label: 'Calendrier' },
    { id: 'booking', label: 'Rendez-vous' },
    { id: 'messages', label: 'Messages' },
    { id: 'stats', label: 'Stats' },
    { id: 'history', label: 'Historique' },
    { id: 'account', label: 'Compte' },
  ]

  // Calendar data (state already declared at top)

  const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month: number, year: number) => (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0

  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear)
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear)

  const postsByDate: Record<string, typeof clientPosts> = {}
  clientPosts.forEach(p => {
    const date = p.publishedAt
    if (!postsByDate[date]) postsByDate[date] = []
    postsByDate[date].push(p)
  })

  const prevMonth = () => {
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) }
    else setCalendarMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) }
    else setCalendarMonth(m => m + 1)
  }

  return (
    <div>
      {/* Header */}
      <header className="flex items-start justify-between mb-12">
        <div>
          <p className="text-blanc-muted text-xs uppercase tracking-wider mb-1">Espace client</p>
          <h1 className="text-2xl font-bold text-blanc">{client.name}</h1>
        </div>
        <button
          onClick={async () => { await signOut(); router.push('/login') }}
          className="nsb-btn nsb-btn-secondary"
          style={{ padding: '12px 22px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          Déconnexion
        </button>
      </header>

      <NotificationPrompt />

      {/* Stats — Bento grid */}
      {(() => {
        const avgEngagement = publishedPosts.length > 0
          ? publishedPosts.reduce((s, p) => {
              const m = metrics.find(mt => mt.postId === p.id)
              return s + (m?.engagementRate || 0)
            }, 0) / publishedPosts.length
          : 0
        const totalImpressions = metrics.reduce((s, m) => s + (m.impressions || 0), 0)
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: '56px' }}>
            {/* Posts publiés */}
            <MagicCard>
              <div style={{ padding: '22px 26px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
                  <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', background: '#ca8a04', boxShadow: '0 0 8px rgba(202,138,4,0.6)' }} />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blanc-muted/70">Posts publiés</p>
                </div>
                <p className="font-heading italic text-4xl text-blanc leading-none" style={{ letterSpacing: '-0.02em' }}>
                  <NumberTicker value={publishedPosts.length} />
                </p>
                {totalImpressions > 0 && (
                  <p className="text-[11px] text-blanc-muted/60" style={{ marginTop: '8px' }}>
                    <NumberTicker value={totalImpressions} /> impressions
                  </p>
                )}
              </div>
            </MagicCard>

            {/* Petite carte top : En attente */}
            <MagicCard>
              <div style={{ padding: '22px 26px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
                  <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', background: pendingPosts.length > 0 ? '#eab308' : 'rgba(255,255,255,0.3)' }} />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blanc-muted/70">En attente</p>
                </div>
                <p className="font-heading italic text-4xl text-blanc leading-none" style={{ letterSpacing: '-0.02em' }}>
                  <NumberTicker value={pendingPosts.length} />
                </p>
                <p className="text-[11px] text-blanc-muted/60" style={{ marginTop: '8px' }}>
                  {pendingPosts.length === 0 ? 'Rien à valider' : pendingPosts.length === 1 ? 'à valider' : 'à valider'}
                </p>
              </div>
            </MagicCard>

            {/* Petite carte bottom : Engagement */}
            <MagicCard>
              <div style={{ padding: '22px 26px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
                  <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', background: '#8b5cf6', boxShadow: '0 0 8px rgba(139,92,246,0.5)' }} />
                  <p className="text-[11px] uppercase tracking-[0.18em] text-blanc-muted/70">Engagement</p>
                </div>
                <p className="font-heading italic text-4xl leading-none" style={{ color: '#8b5cf6', letterSpacing: '-0.02em' }}>
                  <NumberTicker value={avgEngagement} decimalPlaces={2} suffix="%" />
                </p>
                <p className="text-[11px] text-blanc-muted/60" style={{ marginTop: '8px' }}>taux moyen</p>
              </div>
            </MagicCard>
          </div>
        )
      })()}

      {/* Tabs */}
      <div className="overflow-x-auto" style={{ marginBottom: '48px' }}>
        <SliderTabs
          items={TABS.map(t => ({ id: t.id, label: t.label }))}
          value={activeTab}
          onChange={(id) => setActiveTab(id as Tab)}
        />
      </div>

      <AnimatePresence mode="wait">
        {/* Calendar tab */}
        {activeTab === 'calendar' && (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-[minmax(0,280px)_1fr] gap-12 items-start"
          >
          <div>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-8">
              <button onClick={prevMonth} className="text-blanc-muted hover:text-blanc text-sm cursor-pointer" style={{ padding: '8px 16px' }}>
                ← {MONTHS_FR[calendarMonth === 0 ? 11 : calendarMonth - 1]}
              </button>
              <h2 className="text-lg font-semibold text-blanc">
                {MONTHS_FR[calendarMonth]} {calendarYear}
              </h2>
              <button onClick={nextMonth} className="text-blanc-muted hover:text-blanc text-sm cursor-pointer" style={{ padding: '8px 16px' }}>
                {MONTHS_FR[calendarMonth === 11 ? 0 : calendarMonth + 1]} →
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                <div key={d} className="text-center text-xs text-blanc-muted font-medium" style={{ padding: '8px 0' }}>{d}</div>
              ))}

              {/* Empty cells for first day offset */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayPosts = postsByDate[dateStr] || []
                const isToday = dateStr === now.toISOString().split('T')[0]
                const isSelected = selectedDate === dateStr
                const hasPost = dayPosts.length > 0
                // Etat visuel : vert = tous valides (ou publies) / orange = au moins 1 non valide
                const allValidated = hasPost && dayPosts.every(p => p.status === 'published' || !!p.validatedAt)
                const dotColor = allValidated ? '#22c55e' : '#ea580c'
                const bgTint = allValidated ? '#22c55e10' : '#ea580c10'

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={cn(
                      'relative rounded-xl text-sm cursor-pointer transition-all duration-200 text-center',
                      isSelected ? 'ring-2' : '',
                      hasPost ? 'font-semibold' : 'text-blanc-muted',
                    )}
                    style={{
                      padding: '12px 0',
                      backgroundColor: hasPost ? bgTint : isToday ? 'var(--noir-elevated)' : 'transparent',
                      color: hasPost ? 'var(--blanc)' : undefined,
                      ['--tw-ring-color' as string]: '#8b5cf6',
                    }}
                  >
                    {day}
                    {hasPost && (
                      <span
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full"
                        style={{
                          width: '5px',
                          height: '5px',
                          backgroundColor: dotColor,
                          boxShadow: allValidated ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

          </div>

          {/* Right column : post content */}
          <div className="lg:sticky lg:top-6">
            {selectedDate && postsByDate[selectedDate] ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {(() => {
                  const d = new Date(selectedDate + 'T00:00:00')
                  const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' })
                  const dayNum = d.getDate()
                  const month = d.toLocaleDateString('fr-FR', { month: 'long' })
                  return (
                    <div className="flex items-baseline gap-3" style={{ marginBottom: '28px' }}>
                      <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)', transform: 'translateY(-6px)' }} />
                      <h3 className="font-heading italic text-blanc" style={{ fontSize: '28px', lineHeight: 1.1, letterSpacing: '-0.01em', fontWeight: 400 }}>
                        Post du <span style={{ color: '#ca8a04' }}>{weekday}</span> {dayNum} {month}
                      </h3>
                    </div>
                  )
                })()}
                {postsByDate[selectedDate].map(post => (
                  <PostCopyCard
                    key={post.id}
                    postId={post.id}
                    clientId={client.id}
                    content={post.content}
                    files={post.files}
                    validatedAt={post.validatedAt}
                    onValidate={() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, validatedAt: new Date().toISOString() } : p))}
                    onUnvalidate={() => setPosts(prev => prev.map(p => p.id === post.id ? { ...p, validatedAt: null } : p))}
                  />
                ))}
              </motion.div>
            ) : (
              <div className="bg-noir-elevated rounded-xl text-center" style={{ padding: '60px 28px' }}>
                <p className="text-sm text-blanc-muted">
                  {selectedDate ? "Aucun post prévu ce jour-là." : "Clique sur un jour pour voir le post à publier."}
                </p>
              </div>
            )}
          </div>
          </motion.div>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Global stats */}
            <div className="grid grid-cols-2 gap-5 mb-12">
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}>
                <p className="text-blanc-muted text-xs mb-2">Impressions totales</p>
                <p className="text-3xl font-bold text-blanc">{formatNumber(publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.impressions || 0) }, 0))}</p>
              </div>
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}>
                <p className="text-blanc-muted text-xs mb-2">Likes totaux</p>
                <p className="text-3xl font-bold text-blanc">{formatNumber(publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.likes || 0) }, 0))}</p>
              </div>
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}>
                <p className="text-blanc-muted text-xs mb-2">Commentaires totaux</p>
                <p className="text-3xl font-bold text-blanc">{formatNumber(publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.comments || 0) }, 0))}</p>
              </div>
              <div className="bg-noir-elevated rounded-xl" style={{ padding: '24px 28px' }}>
                <p className="text-blanc-muted text-xs mb-2">Engagement moyen</p>
                <p className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>
                  {publishedPosts.length > 0
                    ? (publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.engagementRate || 0) }, 0) / publishedPosts.length).toFixed(2)
                    : '0'}%
                </p>
              </div>
            </div>

            {/* Posts ranked by performance */}
            <h2 className="text-base font-semibold text-blanc mb-6">Performance par post</h2>
            <div className="space-y-4">
              {[...publishedPosts]
                .map(p => ({ ...p, m: metrics.find(mt => mt.postId === p.id) }))
                .filter(p => p.m)
                .sort((a, b) => (b.m!.impressions * b.m!.engagementRate) - (a.m!.impressions * a.m!.engagementRate))
                .map((post, i) => {
                  const isOpen = expandedPost === post.id
                  const firstLine = post.content.split('\n').filter(l => l.trim())[0] || ''
                  return (
                    <div key={post.id}>
                      <button
                        onClick={() => setExpandedPost(isOpen ? null : post.id)}
                        className="w-full text-left bg-noir-elevated rounded-xl transition-all duration-200 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                        style={{ padding: '20px 24px' }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl font-bold" style={{ color: i === 0 ? '#8b5cf6' : 'var(--blanc-muted)', opacity: i === 0 ? 1 : 0.3 }}>
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-base text-blanc truncate">{firstLine}</p>
                            <p className="text-xs text-blanc-muted mt-1">{formatRelative(post.publishedAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-blanc">{formatNumber(post.m!.impressions)}</p>
                            <p className="text-xs" style={{ color: '#8b5cf6' }}>{post.m!.engagementRate}%</p>
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-noir-light rounded-b-xl -mt-2" style={{ padding: '24px' }}>
                              <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}>
                                  <p className="text-xs text-blanc-muted mb-1">Impressions</p>
                                  <p className="text-lg font-bold text-blanc">{formatNumber(post.m!.impressions)}</p>
                                </div>
                                <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}>
                                  <p className="text-xs text-blanc-muted mb-1">Likes</p>
                                  <p className="text-lg font-bold text-blanc">{post.m!.likes}</p>
                                </div>
                                <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}>
                                  <p className="text-xs text-blanc-muted mb-1">Commentaires</p>
                                  <p className="text-lg font-bold text-blanc">{post.m!.comments}</p>
                                </div>
                                <div className="bg-noir-card rounded-xl" style={{ padding: '16px 20px' }}>
                                  <p className="text-xs text-blanc-muted mb-1">Engagement</p>
                                  <p className="text-lg font-bold" style={{ color: '#8b5cf6' }}>{post.m!.engagementRate}%</p>
                                </div>
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

        {/* Booking tab */}
        {activeTab === 'booking' && (
          <motion.div key="booking" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <BookingTab clientId={client.id} clientName={client.name} />
          </motion.div>
        )}

        {/* Account tab : Google Calendar + mot de passe */}
        {activeTab === 'account' && (
          <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {/* Infos personnelles */}
            <div className="relative rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', marginBottom: '24px' }}>
              <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
              <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
                <h2 className="font-heading text-lg text-blanc italic">Informations personnelles</h2>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-blanc-muted/60 uppercase tracking-wider" style={{ marginBottom: '6px' }}>Email</p>
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      <p className="text-sm text-blanc" style={{ wordBreak: 'break-all' }}>{client.email || '—'}</p>
                    </div>
                  </div>
                  {client.phone && (
                    <div>
                      <p className="text-[10px] text-blanc-muted/60 uppercase tracking-wider" style={{ marginBottom: '6px' }}>Téléphone</p>
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <p className="text-sm text-blanc">{client.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-blanc-muted/50" style={{ marginTop: '16px', lineHeight: '1.6' }}>
                  Pour modifier ton email ou ton téléphone, contacte ton copywriter.
                </p>
              </div>
            </div>

            <NotificationsSettingsCard />
            <GoogleCalendarCard audience="client" returnTo={`/portal/${client.id}`} />
            <ChangePasswordCard />
          </motion.div>
        )}

        {/* History tab , Programmés + Publiés */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Programmés */}
            {scheduledPosts.length > 0 && (
              <section style={{ marginBottom: '72px' }}>
                <h2 className="text-base font-semibold text-blanc mb-6 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2563eb' }} />
                  Programmés
                </h2>
                <div className="flex flex-col" style={{ gap: '16px' }}>
                  {scheduledPosts.map(post => {
                    const firstLine = post.content.split('\n').filter(l => l.trim())[0] || ''
                    const isOpen = expandedPost === post.id
                    const isValid = !!post.validatedAt
                    return (
                      <div key={post.id}>
                        <button
                          onClick={() => setExpandedPost(isOpen ? null : post.id)}
                          className="w-full text-left rounded-xl transition-all duration-200 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                          style={{ padding: '22px 26px', backgroundColor: 'var(--noir-elevated)', border: `1px solid ${isValid ? 'rgba(34,197,94,0.25)' : '#2563eb20'}` }}
                        >
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <span className="text-[10px] font-medium uppercase tracking-wider rounded" style={{ padding: '4px 10px', backgroundColor: '#2563eb12', color: '#2563eb' }}>
                              Programmé
                            </span>
                            {isValid && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider rounded" style={{ padding: '4px 10px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                Validé
                              </span>
                            )}
                            <span className="text-xs text-blanc-muted">{formatRelative(post.publishedAt)}</span>
                          </div>
                          <p className="text-base text-blanc">{firstLine}</p>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-noir-light rounded-b-xl -mt-2 border-l-[3px]" style={{ borderColor: '#2563eb', padding: '24px' }}>
                                <p className="text-sm text-blanc leading-relaxed whitespace-pre-line">{post.content}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Publiés */}
            <section>
              <h2 className="text-base font-semibold text-blanc mb-6 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#059669' }} />
                Publiés
              </h2>
              {publishedPosts.length === 0 ? (
                <p className="text-sm text-blanc-muted py-10">Aucun post publié pour le moment.</p>
              ) : (
                <div className="flex flex-col" style={{ gap: '16px' }}>
                  {publishedPosts.map(post => {
                    const firstLine = post.content.split('\n').filter(l => l.trim())[0] || ''
                    const isOpen = expandedPost === post.id
                    return (
                      <div key={post.id}>
                        <button
                          onClick={() => setExpandedPost(isOpen ? null : post.id)}
                          className="w-full text-left bg-noir-elevated rounded-xl transition-all duration-200 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                          style={{ padding: '22px 26px' }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-medium uppercase tracking-wider rounded" style={{ padding: '4px 10px', backgroundColor: '#05966912', color: '#059669' }}>
                              Publié
                            </span>
                            <span className="text-xs text-blanc-muted">{formatRelative(post.publishedAt)}</span>
                          </div>
                          <p className="text-base text-blanc">{firstLine}</p>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-noir-light rounded-b-xl -mt-2 border-l-[3px]" style={{ borderColor: '#059669', padding: '24px' }}>
                                <p className="text-sm text-blanc leading-relaxed whitespace-pre-line">{post.content}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </motion.div>
        )}

        {/* Messages tab */}
        {activeTab === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <MessageThread
              clientId={client.id}
              currentUser="client"
              accentColor="#8b5cf6"
              otherUserName="Enzo"
              otherUserLastSeen={adminLastSeen}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const IMG_RE = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|$)/i

function PostCopyCard({ postId, clientId, content, files, validatedAt, onValidate, onUnvalidate }: { postId: string; clientId: string; content: string; files?: { name: string; url: string; size?: number }[]; validatedAt?: string | null; onValidate: () => void; onUnvalidate: () => void }) {
  const [copied, setCopied] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const isValidated = !!validatedAt

  const doValidate = async () => {
    if (isValidated || validating) return
    setValidating(true)
    const { validatePost } = await import('@/lib/queries')
    const ok = await validatePost(postId)
    setValidating(false)
    if (ok) onValidate()
  }

  const doUnvalidate = async () => {
    if (!isValidated || validating) return
    setValidating(true)
    const { unvalidatePost } = await import('@/lib/queries')
    const ok = await unvalidatePost(postId)
    setValidating(false)
    if (ok) onUnvalidate()
  }

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])

  const images = (files || []).filter(f => IMG_RE.test(f.url) || IMG_RE.test(f.name))
  const otherFiles = (files || []).filter(f => !(IMG_RE.test(f.url) || IMG_RE.test(f.name)))

  const handleCopy = async () => {
    try {
      // Copy with formatting preserved (line breaks intact)
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = content
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
    // Auto-valide a la copie pour LinkedIn (idempotent)
    doValidate()
  }

  return (
    <div className="bg-noir-elevated rounded-xl" style={{ padding: '28px' }}>
      {/* Versions du post (la plus recente en haut, anciennes en-dessous avec leurs commentaires) */}
      <div className="mb-8">
        <VersionedPostView postId={postId} clientId={clientId} />
      </div>

      {/* Images - preview cliquable avec bouton Telecharger */}
      {images.length > 0 && (
        <div className={cn('grid gap-2 mb-8', images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3')}>
          {images.map((f, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', aspectRatio: images.length === 1 ? '16 / 10' : '1 / 1' }}>
              <button
                type="button"
                onClick={() => setLightboxUrl(f.url)}
                className="absolute inset-0 cursor-zoom-in"
                style={{ padding: 0, background: 'transparent', border: 'none' }}
                aria-label={`Ouvrir ${f.name}`}
              >
                <img
                  src={f.url}
                  alt={f.name}
                  style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/>
                  </svg>
                </div>
              </button>
              {/* Bouton Télécharger (en haut a droite, toujours visible) */}
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const r = await fetch(f.url)
                    const blob = await r.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = f.name || f.url.split('/').pop()?.split('?')[0] || 'image'
                    document.body.appendChild(a); a.click(); a.remove()
                    setTimeout(() => URL.revokeObjectURL(url), 2000)
                  } catch {}
                }}
                title="Télécharger"
                className="absolute flex items-center justify-center rounded-lg cursor-pointer transition-all opacity-90 hover:opacity-100 hover:scale-105"
                style={{ top: '10px', right: '10px', width: '36px', height: '36px', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', backdropFilter: 'blur(6px)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Autres fichiers - affichage lien classique */}
      {otherFiles.length > 0 && (
        <div className="flex flex-col gap-2 mb-8">
          {otherFiles.map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-noir-card rounded-lg hover:bg-noir-card/70 transition-colors"
              style={{ padding: '12px 16px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#8b5cf6' }} className="shrink-0">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-blanc truncate">{f.name}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-blanc-muted shrink-0">
                <path d="M7 17L17 7"/><path d="M7 7h10v10"/>
              </svg>
            </a>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            key="post-lightbox"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[200] flex items-center justify-center cursor-zoom-out"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}
            onClick={() => setLightboxUrl(null)}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxUrl(null) }}
              className="absolute flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
              style={{ top: '20px', right: '20px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              aria-label="Fermer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <button
              onClick={async (e) => {
                e.stopPropagation()
                try {
                  const r = await fetch(lightboxUrl!)
                  const blob = await r.blob()
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = lightboxUrl!.split('/').pop()?.split('?')[0] || 'image'
                  document.body.appendChild(a); a.click(); a.remove()
                  setTimeout(() => URL.revokeObjectURL(url), 2000)
                } catch {}
              }}
              className="absolute flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
              style={{ top: '20px', right: '70px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              aria-label="Télécharger"
              title="Télécharger"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>
            <motion.img
              key={lightboxUrl}
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={lightboxUrl}
              alt="Aperçu"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center flex-wrap" style={{ gap: '12px' }}>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 text-sm font-medium rounded-xl cursor-pointer transition-all duration-300"
          style={{
            padding: '14px 32px',
            backgroundColor: copied ? '#059669' : '#8b5cf6',
            color: 'white',
          }}
        >
          {copied ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Copié&#8201;!
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Copier pour LinkedIn
            </>
          )}
        </button>

        {/* Bouton Valider (ou chip 'Validé' cliquable pour annuler la validation) */}
        {isValidated ? (
          <button
            onClick={doUnvalidate}
            disabled={validating}
            title="Cliquer pour annuler la validation"
            className="group inline-flex items-center gap-2 text-sm font-medium rounded-xl cursor-pointer transition-colors"
            style={{ padding: '12px 22px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}
          >
            <svg className="group-hover:hidden" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <svg className="hidden group-hover:block" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            <span className="group-hover:hidden">{validating ? '…' : 'Validé'}</span>
            <span className="hidden group-hover:block">{validating ? '…' : 'Annuler'}</span>
          </button>
        ) : (
          <button
            onClick={doValidate}
            disabled={validating}
            className="nsb-btn nsb-btn-secondary"
            style={{ padding: '12px 22px', fontSize: '11px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {validating ? 'Validation…' : 'Valider'}
          </button>
        )}

        {copied && (
          <span className="text-xs text-blanc-muted animate-pulse">
            Collez directement sur LinkedIn, la mise en forme est conservée.
          </span>
        )}
      </div>
    </div>
  )
}
