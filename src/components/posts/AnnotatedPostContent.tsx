'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createAnnotation, deleteAnnotation, fetchAnnotations, uploadAnnotationVoice, type PostAnnotation } from '@/lib/queries'
import { useToast } from '@/components/ui/Toast'
import AudioPlayer from '@/components/messaging/AudioPlayer'

type Props = {
  postId: string
  clientId: string
  content: string
  readOnly?: boolean // si true (admin), on montre juste les annotations sans permettre d'en creer
}

function formatRelativeTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "a l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j < 7) return `il y a ${j} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function formatRec(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function AnnotatedPostContent({ postId, clientId, content, readOnly = false }: Props) {
  const toast = useToast()
  const contentRef = useRef<HTMLDivElement>(null)
  const [annotations, setAnnotations] = useState<PostAnnotation[]>([])
  const [loading, setLoading] = useState(true)
  const [selection, setSelection] = useState<{ start: number; end: number; text: string; rect: DOMRect } | null>(null)
  const [composer, setComposer] = useState<{ start: number; end: number; text: string } | null>(null)
  const [openAnnotation, setOpenAnnotation] = useState<string | null>(null)

  // Composer state
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recTime, setRecTime] = useState(0)
  const recRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let mounted = true
    fetchAnnotations(postId).then(a => { if (mounted) { setAnnotations(a); setLoading(false) } })
    return () => { mounted = false }
  }, [postId])

  // Detecter une selection sur le contenu
  useEffect(() => {
    if (readOnly) return
    const onMouseUp = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setSelection(null); return }
      const range = sel.getRangeAt(0)
      const el = contentRef.current
      if (!el || !el.contains(range.commonAncestorContainer)) { setSelection(null); return }
      // Compute char offsets relatifs au contenu complet
      const preRange = range.cloneRange()
      preRange.selectNodeContents(el)
      preRange.setEnd(range.startContainer, range.startOffset)
      const start = preRange.toString().length
      const end = start + range.toString().length
      const text = range.toString()
      if (!text.trim()) { setSelection(null); return }
      const rect = range.getBoundingClientRect()
      setSelection({ start, end, text, rect })
    }
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('touchend', onMouseUp)
    return () => {
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('touchend', onMouseUp)
    }
  }, [readOnly])

  const openComposer = () => {
    if (!selection) return
    setComposer({ start: selection.start, end: selection.end, text: selection.text })
    setSelection(null)
    window.getSelection()?.removeAllRanges()
    setCommentText('')
  }

  const closeComposer = () => {
    setComposer(null); setCommentText('')
    if (recording) stopRecordingAndDiscard()
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const r = new MediaRecorder(stream)
      chunksRef.current = []
      r.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      r.start()
      recRef.current = r
      setRecording(true); setRecTime(0)
      timerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
    } catch (e) {
      toast.error("Impossible d'accéder au micro.")
      console.error(e)
    }
  }

  const stopRecordingAndDiscard = () => {
    if (recRef.current && recRef.current.state !== 'inactive') {
      recRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setRecording(false)
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  const submitVoice = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const r = recRef.current
      if (!r) return resolve(null)
      r.onstop = async () => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `annotation-voice-${Date.now()}.webm`, { type: 'audio/webm' })
        const url = await uploadAnnotationVoice(file)
        resolve(url)
      }
      r.stop()
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    })
  }

  const submit = async () => {
    if (!composer || submitting) return
    const hasText = commentText.trim().length > 0
    if (!hasText && !recording) { toast.warning('Ajoute un commentaire texte ou vocal.'); return }
    setSubmitting(true)
    let voiceUrl: string | undefined
    if (recording) {
      const url = await submitVoice()
      if (!url) { toast.error('Erreur lors de l\u2019upload du vocal.'); setSubmitting(false); return }
      voiceUrl = url
      setRecording(false)
    }
    const created = await createAnnotation({
      postId,
      clientId,
      startOffset: composer.start,
      endOffset: composer.end,
      selectedText: composer.text,
      textContent: hasText ? commentText.trim() : undefined,
      voiceUrl,
    })
    setSubmitting(false)
    if (!created) { toast.error('Erreur lors de la sauvegarde.'); return }
    setAnnotations(prev => [...prev, created].sort((a, b) => a.startOffset - b.startOffset))
    toast.success('Commentaire ajouté.')
    closeComposer()
  }

  const removeAnnotation = async (id: string) => {
    const ok = await deleteAnnotation(id)
    if (!ok) { toast.error('Suppression échouée.'); return }
    setAnnotations(prev => prev.filter(a => a.id !== id))
    setOpenAnnotation(null)
  }

  // Decoupe le contenu en segments texte / segments annotés
  const segments: { text: string; annotationIds: string[] }[] = (() => {
    if (annotations.length === 0) return [{ text: content, annotationIds: [] }]
    // Algorithme simple : on marque chaque caractere avec les annotations couvrant ce point, puis on regroupe par meme set d'annotations
    const n = content.length
    const coverage: string[][] = []
    for (let i = 0; i < n; i++) coverage.push([])
    for (const a of annotations) {
      for (let i = Math.max(0, a.startOffset); i < Math.min(n, a.endOffset); i++) coverage[i].push(a.id)
    }
    const out: { text: string; annotationIds: string[] }[] = []
    let cur = { text: '', ids: coverage[0]?.slice() || [] }
    for (let i = 0; i < n; i++) {
      const ids = coverage[i]
      if (ids.length === cur.ids.length && ids.every((x, k) => x === cur.ids[k])) {
        cur.text += content[i]
      } else {
        if (cur.text) out.push({ text: cur.text, annotationIds: cur.ids })
        cur = { text: content[i], ids: ids.slice() }
      }
    }
    if (cur.text) out.push({ text: cur.text, annotationIds: cur.ids })
    return out
  })()

  return (
    <div className="relative">
      {/* Contenu du post avec highlights */}
      <div ref={contentRef} className="text-[15px] text-blanc leading-[1.9] whitespace-pre-line select-text" style={{ userSelect: 'text' }}>
        {segments.map((seg, i) => {
          if (seg.annotationIds.length === 0) return <span key={i}>{seg.text}</span>
          const firstId = seg.annotationIds[0]
          return (
            <span
              key={i}
              onClick={(e) => { e.stopPropagation(); setOpenAnnotation(firstId) }}
              className="cursor-pointer transition-colors"
              style={{
                background: 'rgba(202,138,4,0.18)',
                borderBottom: '2px solid #ca8a04',
                padding: '0 1px',
              }}
              title="Voir le commentaire"
            >
              {seg.text}
            </span>
          )
        })}
      </div>

      {/* Compteur d'annotations */}
      {!loading && annotations.length > 0 && (
        <div className="flex items-center gap-2" style={{ marginTop: '16px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <p className="text-xs text-blanc-muted/70">{annotations.length} commentaire{annotations.length > 1 ? 's' : ''} {readOnly ? 'du client' : ''}</p>
        </div>
      )}

      {/* Popup "Commenter" sur la selection */}
      <AnimatePresence>
        {selection && !composer && !readOnly && (
          <motion.div
            key="sel-popup"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="fixed z-[60]"
            style={{
              top: selection.rect.top + window.scrollY - 44,
              left: selection.rect.left + selection.rect.width / 2 - 60 + window.scrollX,
            }}
          >
            <button
              onClick={openComposer}
              className="inline-flex items-center gap-2 cursor-pointer"
              style={{
                padding: '8px 14px',
                background: '#0a0a0a',
                border: '1px solid #ca8a04',
                borderRadius: '10px',
                color: '#ca8a04',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Commenter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer modal */}
      <AnimatePresence>
        {composer && (
          <motion.div
            key="composer"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
            onClick={closeComposer}
          >
            <motion.div
              initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 6 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full"
              style={{ maxWidth: '500px', background: 'rgba(20,20,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px 28px 24px', position: 'relative' }}
            >
              <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

              <p className="text-[10px] text-blanc-muted/70 uppercase tracking-wider" style={{ marginBottom: '8px' }}>Commentaire sur</p>
              <div style={{ marginBottom: '20px', padding: '10px 14px', background: 'rgba(202,138,4,0.08)', borderLeft: '2px solid #ca8a04', borderRadius: '6px' }}>
                <p className="text-sm text-blanc italic line-clamp-3">« {composer.text.length > 160 ? composer.text.slice(0, 159) + '…' : composer.text} »</p>
              </div>

              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Ton commentaire..."
                rows={4}
                className="nsb-input"
                style={{ resize: 'none', marginBottom: '14px' }}
                autoFocus
                disabled={recording}
              />

              {recording && (
                <div className="flex items-center gap-3 rounded-xl" style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm text-blanc flex-1">Enregistrement · {formatRec(recTime)}</span>
                  <button onClick={stopRecordingAndDiscard} className="text-xs text-blanc-muted hover:text-red-400 cursor-pointer">Annuler le vocal</button>
                </div>
              )}

              <div className="flex items-center" style={{ gap: '10px' }}>
                {!recording && (
                  <button onClick={startRecording} className="nsb-btn-icon" title="Enregistrer un vocal">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </button>
                )}
                <button onClick={closeComposer} className="nsb-btn nsb-btn-secondary flex-1" disabled={submitting}>Annuler</button>
                <button onClick={submit} className="nsb-btn nsb-btn-primary flex-1" disabled={submitting}>
                  {submitting ? 'Envoi…' : 'Envoyer'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popover d'affichage d'une annotation */}
      <AnimatePresence>
        {openAnnotation && (() => {
          const a = annotations.find(x => x.id === openAnnotation)
          if (!a) return null
          return (
            <motion.div
              key="ann-popup"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[90] flex items-center justify-center px-6"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)' }}
              onClick={() => setOpenAnnotation(null)}
            >
              <motion.div
                initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.98, y: 6 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full"
                style={{ maxWidth: '500px', background: 'rgba(20,20,20,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '28px', position: 'relative' }}
              >
                <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <button
                  onClick={() => setOpenAnnotation(null)}
                  aria-label="Fermer"
                  className="absolute flex items-center justify-center rounded-lg text-blanc-muted hover:text-blanc cursor-pointer"
                  style={{ top: '14px', right: '14px', width: '30px', height: '30px' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>

                <p className="text-[10px] text-blanc-muted/70 uppercase tracking-wider" style={{ marginBottom: '8px' }}>Passage commenté</p>
                <div style={{ marginBottom: '20px', padding: '10px 14px', background: 'rgba(202,138,4,0.08)', borderLeft: '2px solid #ca8a04', borderRadius: '6px' }}>
                  <p className="text-sm text-blanc italic">« {a.selectedText.length > 200 ? a.selectedText.slice(0, 199) + '…' : a.selectedText} »</p>
                </div>

                <p className="text-[10px] text-blanc-muted/70 uppercase tracking-wider" style={{ marginBottom: '10px' }}>Commentaire · {formatRelativeTime(a.createdAt)}</p>
                {a.textContent && (
                  <p className="text-sm text-blanc leading-relaxed whitespace-pre-line" style={{ marginBottom: a.voiceUrl ? '14px' : '0' }}>{a.textContent}</p>
                )}
                {a.voiceUrl && (
                  <div className="rounded-xl" style={{ background: '#8b5cf6', padding: '10px 14px' }}>
                    <AudioPlayer src={a.voiceUrl} accentColor="#8b5cf6" isMe label="Commentaire vocal" />
                  </div>
                )}

                {!readOnly && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      onClick={() => removeAnnotation(a.id)}
                      className="text-xs text-red-400/80 hover:text-red-400 cursor-pointer"
                    >
                      Supprimer ce commentaire
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </div>
  )
}
