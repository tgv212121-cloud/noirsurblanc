'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { useToast } from '@/components/ui/Toast'
import { fetchClient, fetchClientPosts, fetchMetrics, fetchReminders, createPost, updatePost, deletePost, fetchOnboardingAnswers, uploadPostFile } from '@/lib/queries'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { PostFile } from '@/types'
import { formatNumber, formatDate, formatRelative, cn } from '@/lib/utils'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import PulseButton from '@/components/ui/PulseButton'
import SliderTabs from '@/components/ui/SliderTabs'
import MessageThread from '@/components/messaging/MessageThread'
import VersionedPostView from '@/components/posts/VersionedPostView'
import PerformanceInsights from '@/components/posts/PerformanceInsights'
import UnipileSyncBadge from '@/components/posts/UnipileSyncBadge'
import NotificationPrompt from '@/components/ui/NotificationPrompt'
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
  // Edition de post existant
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editDate, setEditDate] = useState('')
  const [editFiles, setEditFiles] = useState<PostFile[]>([])
  const [editUploading, setEditUploading] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [postToDelete, setPostToDelete] = useState<Post | null>(null)
  const [deletingPost, setDeletingPost] = useState(false)
  const searchParams = useSearchParams()
  const urlTab = searchParams.get('tab') as Tab | null
  const validTabs: Tab[] = ['calendar', 'conversation', 'stats', 'onboarding']
  const initialTab: Tab = urlTab && validTabs.includes(urlTab) ? urlTab : 'calendar'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

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
  clientPosts.forEach(p => {
    const dateKey = p.publishedAt.includes('T') ? p.publishedAt.split('T')[0] : p.publishedAt
    if (!postsByDate[dateKey]) postsByDate[dateKey] = []
    postsByDate[dateKey].push(p)
  })
  const prevMonth = () => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1) } else setCalendarMonth(m => m - 1) }
  const nextMonth = () => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1) } else setCalendarMonth(m => m + 1) }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-blanc-muted hover:text-gold transition-colors duration-200">← Clients</Link>
      </div>

      <NotificationPrompt />

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
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3" style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px', paddingBottom: '4px' }}>
          <div><p className="text-xs text-blanc-muted mb-1">Client depuis</p><p className="text-sm text-blanc">{formatDate(client.onboardedAt)}</p></div>
          <div><p className="text-xs text-blanc-muted mb-1">LinkedIn</p>{client.linkedinUrl ? <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold hover:text-gold-dark transition-colors duration-200">Voir le profil</a> : <p className="text-sm text-blanc-muted/50">Non renseigné</p>}</div>
          <div>
            <p className="text-xs text-blanc-muted mb-1">Dernière connexion</p>
            {client.lastSeenAt ? (() => {
              const d = new Date(client.lastSeenAt)
              const diffMs = Date.now() - d.getTime()
              const online = diffMs < 2 * 60_000
              const min = Math.floor(diffMs / 60_000)
              const hour = Math.floor(diffMs / 3_600_000)
              const day = Math.floor(diffMs / 86_400_000)
              let label: string
              if (online) label = 'En ligne'
              else if (min < 60) label = `il y a ${min} min`
              else if (hour < 24) label = `il y a ${hour} h`
              else if (day < 7) label = `il y a ${day} j`
              else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
              const exact = d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
              return (
                <div className="flex items-center gap-2" title={exact}>
                  <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: online ? '#22c55e' : 'rgba(255,255,255,0.3)', boxShadow: online ? '0 0 8px rgba(34,197,94,0.6)' : 'none' }} />
                  <p className="text-sm text-blanc">{label}</p>
                </div>
              )
            })() : <p className="text-sm text-blanc-muted/50">Jamais connecté</p>}
          </div>
        </div>
      </div>



      {/* Tabs */}
      <div className="overflow-x-auto" style={{ marginTop: '40px', marginBottom: '40px' }}>
        <SliderTabs
          items={TABS.map(t => ({ id: t.id, label: t.label }))}
          value={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
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
                // Tous les posts du jour valides (ou publies) -> vert ; sinon bleu
                const allValidated = hasPost && dayPosts.every(p => p.status === 'published' || !!p.validatedAt)
                const dotColor = allValidated ? '#22c55e' : '#2563eb'
                const bgTint = allValidated ? '#22c55e12' : '#2563eb10'
                return (
                  <button key={day} onClick={() => { setEditingDate(isEditing ? null : dateStr); setSelectedDate(isEditing ? null : dateStr); if (!hasPost) setNewPost('') }}
                    className={cn('relative rounded-xl text-sm cursor-pointer transition-all duration-200 text-center', (isSelected || isEditing) ? 'ring-2' : '', hasPost ? 'font-semibold' : 'text-blanc-muted')}
                    style={{ padding: '12px 0', backgroundColor: hasPost ? bgTint : isToday ? 'var(--noir-elevated)' : 'transparent', color: hasPost ? 'var(--blanc)' : undefined, ['--tw-ring-color' as string]: allValidated ? '#22c55e' : '#2563eb'}}>
                    {day}
                    {hasPost && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full" style={{ width: '5px', height: '5px', backgroundColor: dotColor, boxShadow: allValidated ? '0 0 6px rgba(34,197,94,0.5)' : 'none' }} />}
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
                <div className="flex items-center justify-between" style={{ marginBottom: '28px' }}>
                  {(() => {
                    const d = new Date(editingDate + 'T00:00:00')
                    const weekday = d.toLocaleDateString('fr-FR', { weekday: 'long' })
                    const dayNum = d.getDate()
                    const month = d.toLocaleDateString('fr-FR', { month: 'long' })
                    const year = d.getFullYear()
                    return (
                      <div className="flex items-baseline gap-3">
                        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)', transform: 'translateY(-6px)' }} />
                        <h3 className="font-heading italic text-blanc" style={{ fontSize: '28px', lineHeight: 1.1, letterSpacing: '-0.01em', fontWeight: 400 }}>
                          <span style={{ color: '#ca8a04' }}>{weekday}</span> {dayNum} {month} {year}
                        </h3>
                      </div>
                    )
                  })()}
                  <button onClick={() => { setEditingDate(null); setSelectedDate(null) }} className="text-xs text-blanc-muted hover:text-blanc cursor-pointer">Fermer</button>
                </div>

                {/* If post exists for this date , show it */}
                {postsByDate[editingDate] ? (
                  postsByDate[editingDate].map(post => {
                    const m = metrics.find(mt => mt.postId === post.id)
                    const isEditing = editingPostId === post.id
                    const canEdit = post.status !== 'published'

                    const startEdit = () => {
                      setEditingPostId(post.id)
                      setEditContent(post.content)
                      setEditDate(post.publishedAt)
                      setEditFiles(post.files || [])
                    }
                    const cancelEdit = () => {
                      setEditingPostId(null)
                      setEditContent('')
                      setEditDate('')
                      setEditFiles([])
                    }
                    const saveEdit = async () => {
                      if (editSaving) return
                      setEditSaving(true)
                      const ok = await updatePost(post.id, { content: editContent, publishedAt: editDate, files: editFiles })
                      setEditSaving(false)
                      if (!ok) { toast.error('Sauvegarde échouée.'); return }
                      setInitialPosts(prev => prev.map(p => p.id === post.id ? { ...p, content: editContent, publishedAt: editDate, files: editFiles } : p))
                      toast.success('Post mis à jour.')
                      cancelEdit()
                      if (editDate !== post.publishedAt) setEditingDate(editDate)
                    }
                    const editRemoveFile = (idx: number) => setEditFiles(prev => prev.filter((_, i) => i !== idx))
                    const editUpload = async (file: File | undefined) => {
                      if (!file) return
                      setEditUploading(true)
                      const result = await uploadPostFile(file)
                      setEditUploading(false)
                      if (!result) { toast.error("Erreur lors de l'upload."); return }
                      setEditFiles(prev => [...prev, result])
                    }

                    return (
                      <div key={post.id} className="bg-noir-elevated rounded-xl" style={{ padding: '28px' }}>
                        <div className="flex items-center gap-3 mb-5 flex-wrap">
                          <span className="text-[10px] font-medium uppercase tracking-wider rounded"
                            style={{ padding: '4px 10px', backgroundColor: post.status === 'published' ? '#05966912' : '#2563eb12', color: post.status === 'published' ? '#059669' : '#2563eb' }}>
                            {post.status === 'published' ? 'Publié' : 'Programmé'}
                          </span>
                          {post.validatedAt && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider rounded" style={{ padding: '4px 10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              Validé par le client
                            </span>
                          )}
                          {canEdit && !isEditing && (
                            <div className="ml-auto flex items-center gap-2">
                              <button onClick={startEdit} className="nsb-btn nsb-btn-secondary" style={{ padding: '8px 16px', fontSize: '10.5px' }}>
                                Modifier
                              </button>
                              <button onClick={() => setPostToDelete(post)} className="nsb-btn nsb-btn-secondary" style={{ padding: '8px 14px', fontSize: '10.5px', color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <>
                            <label className="text-[10px] text-blanc-muted/70 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Date de publication</label>
                            <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="nsb-input" style={{ maxWidth: '220px', marginBottom: '18px' }} />
                            <label className="text-[10px] text-blanc-muted/70 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Contenu</label>
                            <textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              ref={(el) => { if (el) { el.style.height = 'auto'; el.style.height = Math.max(el.scrollHeight, 220) + 'px' } }}
                              onInput={e => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px' }}
                              className="nsb-input leading-relaxed"
                              style={{ minHeight: '220px', resize: 'none', fontSize: '15px' }}
                            />

                            {/* Fichiers / images */}
                            <label className="text-[10px] text-blanc-muted/70 uppercase tracking-wider block" style={{ marginTop: '18px', marginBottom: '10px' }}>Photos &amp; fichiers</label>
                            {editFiles.length > 0 && (
                              <div className="flex flex-wrap gap-3" style={{ marginBottom: '14px' }}>
                                {editFiles.map((f, i) => {
                                  const isImg = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|$)/i.test(f.url)
                                  return (
                                    <div key={i} className="relative group">
                                      {isImg ? (
                                        <img src={f.url} alt={f.name} style={{ width: '110px', height: '110px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} />
                                      ) : (
                                        <div className="flex items-center gap-2 rounded-lg" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', maxWidth: '260px' }}>
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                          <span className="text-xs text-blanc truncate">{f.name}</span>
                                        </div>
                                      )}
                                      <button
                                        onClick={() => editRemoveFile(i)}
                                        title="Retirer"
                                        className="absolute flex items-center justify-center rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                        style={{ top: '-6px', right: '-6px', width: '22px', height: '22px', background: '#ef4444', color: 'white', border: '2px solid #0a0a0a' }}
                                      >
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            <label className="inline-flex items-center gap-2 cursor-pointer nsb-btn nsb-btn-secondary" style={{ padding: '9px 18px', fontSize: '10.5px' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                              {editUploading ? 'Envoi…' : 'Ajouter un fichier'}
                              <input type="file" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; await editUpload(f) }} />
                            </label>

                            <div className="flex items-center gap-3" style={{ marginTop: '22px' }}>
                              <button onClick={cancelEdit} disabled={editSaving} className="nsb-btn nsb-btn-secondary" style={{ padding: '11px 22px' }}>
                                Annuler
                              </button>
                              <button onClick={saveEdit} disabled={editSaving || !editContent.trim() || !editDate} className="nsb-btn nsb-btn-primary" style={{ padding: '11px 22px' }}>
                                {editSaving ? 'Enregistrement…' : 'Enregistrer'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="mb-6" style={{ maxWidth: '60ch' }}>
                              <VersionedPostView postId={post.id} clientId={id} readOnly />
                            </div>
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
                          </>
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
                          // Push notification au client
                          try {
                            const { supabase: sb } = await import('@/lib/supabase')
                            const { data: sess } = await sb.auth.getSession()
                            const tok = sess.session?.access_token
                            if (tok) {
                              await fetch('/api/push/notify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
                                body: JSON.stringify({ kind: 'post', clientId: id, excerpt: newPost.slice(0, 80) }),
                              })
                            }
                          } catch (e) { console.error('push post', e) }
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
              otherUserLastSeen={client.lastSeenAt}
              whatsappPhone={client.phone}
            />
          </motion.div>
        )}

        {/* Stats tab */}
        {activeTab === 'stats' && (
          <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            {/* Sync badge (LinkedIn / Unipile) */}
            <div style={{ marginBottom: '40px' }}>
              <UnipileSyncBadge clientId={client.id} />
            </div>

            {/* Section 1 : Insights (top 3 + patterns) */}
            <PerformanceInsights posts={publishedPosts} metrics={metrics} clientFirstName={client.name.split(' ')[0]} />

            {/* Section 2 : 4 KPI globaux en ligne premium */}
            <div className="flex items-center gap-3" style={{ marginTop: '56px', marginBottom: '20px' }}>
              <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
              <h3 className="font-heading italic text-blanc" style={{ fontSize: '20px' }}>Vue d&apos;ensemble</h3>
            </div>
            {(() => {
              const totalComments = publishedPosts.reduce((s, p) => { const m = metrics.find(mt => mt.postId === p.id); return s + (m?.comments || 0) }, 0)
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4" style={{ marginBottom: '56px', gap: '20px' }}>
                  <KpiCard label="Impressions" value={formatNumber(totalImpressions)} accent="white" />
                  <KpiCard label="Likes" value={formatNumber(totalLikes)} accent="white" />
                  <KpiCard label="Commentaires" value={formatNumber(totalComments)} accent="white" />
                  <KpiCard label="Engagement" value={`${avgEngagement}%`} accent="gold" />
                </div>
              )
            })()}

            {/* Section 3 : Performance par post (liste detaillee) */}
            <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
              <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
              <h3 className="font-heading italic text-blanc" style={{ fontSize: '20px' }}>Performance par post</h3>
              <span className="text-xs text-blanc-muted/60" style={{ marginLeft: '8px' }}>{publishedPosts.length} posts</span>
            </div>
            {(() => {
              const ranked = [...publishedPosts]
                .map(p => ({ ...p, m: metrics.find(mt => mt.postId === p.id) }))
                .filter(p => p.m)
                .sort((a, b) => (b.m!.impressions * b.m!.engagementRate) - (a.m!.impressions * a.m!.engagementRate))
              const topImpressions = ranked[0]?.m?.impressions || 1
              const baselineRate = ranked.length > 0 ? ranked.reduce((s, p) => s + p.m!.engagementRate, 0) / ranked.length : 0
              return (
                <div className="flex flex-col" style={{ gap: '12px' }}>
                  {ranked.map((post, i) => {
                    const isOpen = expandedPost === post.id
                    const firstLine = post.content.split('\n').filter(l => l.trim())[0] || ''
                    const widthPct = Math.min(100, Math.max(8, (post.m!.impressions / topImpressions) * 100))
                    const rateDelta = post.m!.engagementRate - baselineRate
                    const isAbove = rateDelta > 0.05
                    const isBelow = rateDelta < -0.05
                    return (
                      <div key={post.id}>
                        <button
                          onClick={() => setExpandedPost(isOpen ? null : post.id)}
                          className="w-full text-left rounded-xl transition-all duration-200 cursor-pointer hover:bg-white/[0.025]"
                          style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                        >
                          {/* Ligne 1 : rank + preview + impressions */}
                          <div className="flex items-start gap-4">
                            <span className="font-heading italic shrink-0" style={{ fontSize: '22px', color: i < 3 ? '#ca8a04' : 'rgba(255,255,255,0.3)', minWidth: '28px', textAlign: 'center' }}>
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-blanc leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {firstLine}
                              </p>
                              <div className="flex items-center gap-3 flex-wrap" style={{ marginTop: '8px' }}>
                                <span className="text-[11px] text-blanc-muted/60">{formatRelative(post.publishedAt)}</span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-blanc-muted/70">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7"/></svg>
                                  {post.m!.likes}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-blanc-muted/70">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                  {post.m!.comments}
                                </span>
                                {post.m!.reposts > 0 && (
                                  <span className="inline-flex items-center gap-1 text-[11px] text-blanc-muted/70">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
                                    {post.m!.reposts}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-base font-medium text-blanc tabular-nums">{formatNumber(post.m!.impressions)}</p>
                              <div className="flex items-center justify-end gap-1.5" style={{ marginTop: '2px' }}>
                                <p className="text-xs tabular-nums" style={{ color: '#ca8a04' }}>{post.m!.engagementRate.toFixed(2)}%</p>
                                {isAbove && <span className="text-[9px] text-green-400/80">↑</span>}
                                {isBelow && <span className="text-[9px] text-red-400/70">↓</span>}
                              </div>
                            </div>
                          </div>
                          {/* Ligne 2 : barre de progression relative */}
                          <div style={{ marginTop: '12px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: widthPct + '%', background: i === 0 ? 'linear-gradient(90deg, #a16207, #eab308)' : 'rgba(202,138,4,0.4)', borderRadius: '999px', transition: 'width 0.3s ease' }} />
                          </div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                              <div className="rounded-xl -mt-1" style={{ padding: '22px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
                                <p className="text-sm text-blanc leading-relaxed whitespace-pre-line">{post.content}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
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

      <ConfirmModal
        open={!!postToDelete}
        danger
        title="Supprimer ce post ?"
        message={postToDelete ? `Le post du ${new Date(postToDelete.publishedAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} sera supprimé définitivement. Le client ne le verra plus.` : ''}
        confirmLabel={deletingPost ? 'Suppression…' : 'Supprimer'}
        cancelLabel="Annuler"
        onCancel={() => { if (!deletingPost) setPostToDelete(null) }}
        onConfirm={async () => {
          if (!postToDelete || deletingPost) return
          setDeletingPost(true)
          const ok = await deletePost(postToDelete.id)
          setDeletingPost(false)
          if (ok) {
            setInitialPosts(prev => prev.filter(p => p.id !== postToDelete.id))
            toast.success('Post supprimé.')
            setPostToDelete(null)
          } else {
            toast.error('Suppression échouée.')
          }
        }}
      />
    </div>
  )
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent: 'white' | 'gold' }) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{
      padding: '22px 24px',
      background: accent === 'gold'
        ? 'linear-gradient(135deg, rgba(202,138,4,0.08), rgba(202,138,4,0.02))'
        : 'rgba(255,255,255,0.025)',
      border: `1px solid ${accent === 'gold' ? 'rgba(202,138,4,0.25)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <p className="text-[11px] uppercase tracking-[0.16em] text-blanc-muted/60" style={{ marginBottom: '12px' }}>{label}</p>
      <p className={`font-heading font-medium leading-none ${accent === 'gold' ? 'text-gold italic' : 'text-blanc'}`} style={{ fontSize: '34px', letterSpacing: '-0.01em' }}>{value}</p>
    </div>
  )
}
