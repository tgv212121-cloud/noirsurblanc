'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { fetchClient, fetchClientPosts, fetchMetrics, fetchReminders } from '@/lib/queries'
import { formatNumber, formatRelative, cn } from '@/lib/utils'
import type { Client, Post, PostMetrics, Reminder } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import GooeyNav from '@/components/ui/GooeyNavComponent'
import QuestionCard from '@/components/onboarding/QuestionCard'
import ProgressBar from '@/components/onboarding/ProgressBar'
import { questions } from '@/components/onboarding/questions'
import { ChevronRight, ChevronLeft } from '@/components/onboarding/icons'

type Tab = 'calendar' | 'messages' | 'stats' | 'history'

export default function ClientPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [client, setClient] = useState<Client | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('calendar')
  const [expandedPost, setExpandedPost] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    Promise.all([fetchClient(id), fetchClientPosts(id), fetchMetrics(), fetchReminders()]).then(([c, p, m, r]) => {
      setClient(c); setPosts(p); setMetrics(m); setReminders(r.filter(x => x.clientId === id)); setLoading(false)
    })
  }, [id])

  // Onboarding state
  const [onboardingDone, setOnboardingDone] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | Record<number, string>>>({})
  const [direction, setDirection] = useState(1)

  const handleAnswer = useCallback((questionId: number, value: string | Record<number, string>) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < questions.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      setOnboardingDone(true)
    }
  }, [currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleNext()
  }, [handleNext])

  if (!client) {
    return (
      <div className="py-20 text-center">
        <p className="text-blanc-muted text-lg">Espace introuvable.</p>
      </div>
    )
  }

  // Show onboarding if client status is 'onboarding' and not done yet
  const needsOnboarding = client.status === 'onboarding' && !onboardingDone

  if (needsOnboarding) {
    return (
      <div className="min-h-screen flex flex-col" onKeyDown={handleKeyDown} style={{ margin: '-40px -32px' }}>
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center text-white text-sm font-semibold rounded-lg"
              style={{ width: '36px', height: '36px', backgroundColor: '#8b5cf6' }}
            >
              {client.avatar}
            </div>
            <div>
              <p className="text-sm font-medium text-blanc">{client.name}</p>
              <p className="text-xs text-blanc-muted">Onboarding</p>
            </div>
          </div>
          <span className="text-blanc-muted text-xs tracking-widest uppercase">
            {String(currentStep + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
          </span>
        </header>

        <ProgressBar current={currentStep} total={questions.length} />

        {/* Question */}
        <main className="flex-1 flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction}>
              <QuestionCard
                key={questions[currentStep].id}
                question={questions[currentStep]}
                answer={answers[questions[currentStep].id]}
                onAnswer={handleAnswer}
                direction={direction}
              />
            </AnimatePresence>
          </div>
        </main>

        {/* Navigation */}
        <nav className="flex flex-col items-center gap-4 px-8 py-8">
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 text-sm font-medium cursor-pointer rounded-xl transition-colors duration-200"
            style={{ padding: '14px 32px', backgroundColor: '#8b5cf6', color: 'white' }}
          >
            {currentStep === questions.length - 1 ? 'Terminer' : 'Continuer'}
            <ChevronRight width={16} height={16} />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 text-blanc-muted text-xs cursor-pointer disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft width={14} height={14} />
            Précédent
          </button>
        </nav>

        <div className="text-center pb-5">
          <span className="text-blanc-muted text-[10px] tracking-widest uppercase">
            Ctrl + Enter pour continuer
          </span>
        </div>
      </div>
    )
  }

  const clientPosts = posts
    .filter(p => p.clientId === id)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  const publishedPosts = clientPosts.filter(p => p.status === 'published')
  const pendingPosts = clientPosts.filter(p => p.status === 'draft' || p.status === 'scheduled')

  const clientReminders = reminders.filter(r => r.clientId === id).sort((a, b) => (b.lastSentAt || '').localeCompare(a.lastSentAt || ''))
  const messageThread = clientReminders.filter(r => r.lastSentAt).flatMap(r => {
    const msgs: { type: 'sent' | 'received'; text: string; date: string }[] = []
    if (r.response && r.lastResponseAt) msgs.push({ type: 'sent', text: r.response, date: r.lastResponseAt })
    msgs.push({ type: 'received', text: r.message, date: r.lastSentAt! })
    return msgs
  }).sort((a, b) => a.date.localeCompare(b.date))

  const TABS: { id: Tab; label: string }[] = [
    { id: 'calendar', label: 'Calendrier' },
    { id: 'messages', label: 'Messages' },
    { id: 'stats', label: 'Stats' },
    { id: 'history', label: 'Historique' },
  ]

  // Build calendar data
  const now = new Date()
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth())
  const [calendarYear, setCalendarYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

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
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div
            className="flex items-center justify-center text-white text-lg font-semibold rounded-xl"
            style={{ width: '48px', height: '48px', backgroundColor: '#8b5cf6' }}
          >
            {client.avatar}
          </div>
          <div>
            <p className="text-blanc-muted text-xs uppercase tracking-wider mb-1">Espace client</p>
            <h1 className="text-2xl font-bold text-blanc">{client.name}</h1>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-12">
        <div className="bg-noir-elevated rounded-xl" style={{ padding: '20px 24px' }}>
          <p className="text-blanc-muted text-xs mb-2">Posts publiés</p>
          <p className="text-2xl font-bold text-blanc">{publishedPosts.length}</p>
        </div>
        <div className="bg-noir-elevated rounded-xl" style={{ padding: '20px 24px' }}>
          <p className="text-blanc-muted text-xs mb-2">En attente de validation</p>
          <p className="text-2xl font-bold text-blanc">{pendingPosts.length}</p>
        </div>
        <div className="bg-noir-elevated rounded-xl" style={{ padding: '20px 24px' }}>
          <p className="text-blanc-muted text-xs mb-2">Engagement moyen</p>
          <p className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>
            {publishedPosts.length > 0
              ? (publishedPosts.reduce((s, p) => {
                  const m = metrics.find(mt => mt.postId === p.id)
                  return s + (m?.engagementRate || 0)
                }, 0) / publishedPosts.length).toFixed(2)
              : '0'}%
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-10">
        <GooeyNav
          items={TABS.map(t => ({ label: t.label }))}
          initialActiveIndex={0}
          particleCount={15}
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
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
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
                      backgroundColor: hasPost
                        ? (dayPosts[0].status === 'published' ? '#05966910' : '#ea580c10')
                        : isToday ? 'var(--noir-elevated)' : 'transparent',
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
                          backgroundColor: dayPosts[0].status === 'published' ? '#059669' : '#ea580c',
                        }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected date — show post content + copy button */}
            {selectedDate && postsByDate[selectedDate] && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-8"
              >
                <p className="text-xs text-blanc-muted mb-6">
                  Post du {new Date(selectedDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {postsByDate[selectedDate].map(post => (
                  <PostCopyCard key={post.id} content={post.content} />
                ))}
              </motion.div>
            )}

            {!selectedDate && (
              <p className="text-sm text-blanc-muted text-center py-8">Cliquez sur un jour pour voir le post à publier.</p>
            )}
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

        {/* History tab — Programmés + Publiés */}
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Programmés */}
            {pendingPosts.length > 0 && (
              <section className="mb-14">
                <h2 className="text-base font-semibold text-blanc mb-6 flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2563eb' }} />
                  Programmés
                </h2>
                <div className="space-y-5">
                  {pendingPosts.map(post => {
                    const firstLine = post.content.split('\n').filter(l => l.trim())[0] || ''
                    const isOpen = expandedPost === post.id
                    return (
                      <div key={post.id}>
                        <button
                          onClick={() => setExpandedPost(isOpen ? null : post.id)}
                          className="w-full text-left rounded-xl transition-all duration-200 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                          style={{ padding: '22px 26px', backgroundColor: 'var(--noir-elevated)', border: '1px solid #2563eb20' }}
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-[10px] font-medium uppercase tracking-wider rounded" style={{ padding: '4px 10px', backgroundColor: '#2563eb12', color: '#2563eb' }}>
                              Programmé
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
                <div className="space-y-5">
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
            <div className="space-y-8 mb-12">
              {messageThread.length === 0 ? (
                <p className="text-sm text-blanc-muted py-12 text-center">Aucun message pour le moment.</p>
              ) : (
                messageThread.map((msg, i) => (
                  <div key={i} className={cn('max-w-[75%]', msg.type === 'sent' ? 'ml-auto' : 'mr-auto')}>
                    <div
                      className="rounded-2xl text-sm leading-relaxed"
                      style={{
                        padding: '18px 22px',
                        ...(msg.type === 'sent'
                          ? { backgroundColor: '#8b5cf6', color: 'white' }
                          : { backgroundColor: 'var(--noir-elevated)', color: 'var(--blanc)' }
                        ),
                      }}
                    >
                      {msg.text}
                    </div>
                    <p className={cn('text-xs text-blanc-muted', msg.type === 'sent' ? 'text-right' : 'text-left')} style={{ marginTop: '8px' }}>
                      {msg.type === 'sent' ? 'Vous' : 'Noirsurblanc'} · {formatRelative(msg.date)}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Input area */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
              <p className="text-xs text-blanc-muted mb-4">Envoyer un message à votre copywriter</p>

              <div className="bg-noir-elevated rounded-2xl" style={{ padding: '16px' }}>
                <textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Votre message..."
                  rows={3}
                  className="w-full bg-transparent text-sm text-blanc placeholder:text-blanc-muted/50 outline-none leading-relaxed"
                  style={{ resize: 'none', padding: '4px 8px' }}
                />

                {/* Action bar */}
                <div className="flex items-center justify-between" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    {/* Attach file */}
                    <button
                      className="flex items-center justify-center rounded-lg text-blanc-muted hover:text-blanc transition-colors duration-200 cursor-pointer"
                      style={{ width: '40px', height: '40px', backgroundColor: 'var(--noir-card)' }}
                      title="Joindre un fichier"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                      </svg>
                    </button>

                    {/* Voice message */}
                    <button
                      className="flex items-center justify-center rounded-lg text-blanc-muted hover:text-blanc transition-colors duration-200 cursor-pointer"
                      style={{ width: '40px', height: '40px', backgroundColor: 'var(--noir-card)' }}
                      title="Message vocal"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    </button>
                  </div>

                  {/* Send */}
                  <button
                    className="inline-flex items-center gap-2 text-sm font-medium rounded-xl cursor-pointer transition-colors duration-200"
                    style={{ padding: '12px 24px', backgroundColor: '#8b5cf6', color: 'white' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                    </svg>
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PostCopyCard({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

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
  }

  return (
    <div className="bg-noir-elevated rounded-xl" style={{ padding: '28px' }}>
      {/* Post text — preserves line breaks exactly as written */}
      <div
        className="text-[15px] text-blanc leading-[1.9] whitespace-pre-line mb-8"
        style={{ maxWidth: '60ch' }}
      >
        {content}
      </div>

      {/* Copy button */}
      <div className="flex items-center gap-4">
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
              Copié !
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

        {copied && (
          <span className="text-xs text-blanc-muted animate-pulse">
            Collez directement sur LinkedIn — la mise en forme est conservée.
          </span>
        )}
      </div>
    </div>
  )
}
