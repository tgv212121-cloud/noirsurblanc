'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchMessages, sendMessage, uploadMessageFile, updateMessage, deleteMessage, markMessagesAsRead, type Message } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { formatMessageTime, cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import AudioPlayer from './AudioPlayer'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'

type Props = {
  clientId: string
  currentUser: 'admin' | 'client'
  accentColor: string
  otherUserName: string
  otherUserLastSeen?: string | null
  whatsappPhone?: string
}

export default function MessageThread({ clientId, currentUser, accentColor, otherUserName, otherUserLastSeen, whatsappPhone }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<Message | null>(null)

  useEffect(() => {
    if (!lightboxUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxUrl(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxUrl])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [toDelete, setToDelete] = useState<Message | null>(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const [recording, setRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const shouldSendRef = useRef(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load + subscribe + polling fallback
  useEffect(() => {
    let mounted = true
    const load = async () => {
      const msgs = await fetchMessages(clientId)
      if (!mounted) return
      setMessages(prev => {
        // Avoid re-render if nothing changed (length + last id + edit/read timestamps)
        if (
          prev.length === msgs.length &&
          prev.every((m, i) => m.id === msgs[i].id && m.editedAt === msgs[i].editedAt && m.readAt === msgs[i].readAt)
        ) return prev
        return msgs
      })
      // Marque comme lus tous les messages de l'autre partie
      markMessagesAsRead(clientId, currentUser).catch(() => {})
    }
    load()

    const channel = supabase
      .channel(`messages:${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const newMsg = payload.new as {
            id: string; client_id: string; sender: 'admin' | 'client';
            text?: string; file_url?: string; voice_url?: string; created_at: string; read_at?: string; reply_to_id?: string;
          }
          setMessages((prev) => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [
              ...prev,
              {
                id: newMsg.id,
                clientId: newMsg.client_id,
                sender: newMsg.sender,
                text: newMsg.text ?? null,
                fileUrl: newMsg.file_url ?? null,
                voiceUrl: newMsg.voice_url ?? null,
                createdAt: newMsg.created_at,
                readAt: newMsg.read_at ?? null,
                replyToId: newMsg.reply_to_id ?? null,
              } as Message,
            ]
          })
          // Si c'est l'autre partie qui vient d'envoyer et qu'on est sur le thread, marque comme lu
          if (newMsg.sender !== currentUser) {
            markMessagesAsRead(clientId, currentUser).catch(() => {})
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const upd = payload.new as { id: string; read_at?: string; text?: string; edited_at?: string }
          setMessages((prev) => prev.map(m => m.id === upd.id
            ? { ...m, readAt: upd.read_at ?? m.readAt, text: upd.text ?? m.text, editedAt: upd.edited_at ?? m.editedAt }
            : m
          ))
        }
      )
      .subscribe()

    // Polling fallback every 4s (in case Realtime isn't enabled or disconnects)
    const interval = setInterval(load, 4000)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [clientId])

  // Auto-scroll only when the count of messages actually grows (new arrival)
  const prevCountRef = useRef(0)
  useEffect(() => {
    if (messages.length > prevCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevCountRef.current = messages.length
  }, [messages.length])

  const notifyCounterparty = async (excerpt: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return
      await fetch('/api/push/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ kind: 'message', clientId, excerpt, from: currentUser }),
      })
    } catch (e) { console.error('notify', e) }
  }

  const handleSendText = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const payload = text.trim()
    const replyId = replyTo?.id
    const success = await sendMessage({ clientId, sender: currentUser, text: payload, replyToId: replyId })
    if (success) {
      setText('')
      setReplyTo(null)
      fetchMessages(clientId).then(setMessages)
      notifyCounterparty(payload)
    }
    setSending(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    const url = await uploadMessageFile(file)
    if (url) {
      await sendMessage({ clientId, sender: currentUser, fileUrl: url, text: file.name })
      fetchMessages(clientId).then(setMessages)
      notifyCounterparty('Nouveau fichier : ' + file.name)
    }
    setSending(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Colle une image directement depuis le presse-papier (Ctrl+V / Cmd+V)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const blob = item.getAsFile()
        if (!blob) continue
        const ext = (item.type.split('/')[1] || 'png').split(';')[0]
        const file = new File([blob], `paste-${Date.now()}.${ext}`, { type: item.type })
        setSending(true)
        const url = await uploadMessageFile(file)
        if (url) {
          await sendMessage({ clientId, sender: currentUser, fileUrl: url, text: file.name })
          fetchMessages(clientId).then(setMessages)
          notifyCounterparty('Nouvelle image')
        }
        setSending(false)
        return
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      shouldSendRef.current = true

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop tracks tout le temps (libere le micro)
        stream.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
        // Si l'utilisateur a annule, on n'envoie rien
        if (!shouldSendRef.current) {
          audioChunksRef.current = []
          return
        }
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        if (blob.size === 0) return
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        setSending(true)
        const url = await uploadMessageFile(file)
        if (url) {
          await sendMessage({ clientId, sender: currentUser, voiceUrl: url })
          fetchMessages(clientId).then(setMessages)
          notifyCounterparty('Message vocal')
        }
        setSending(false)
        audioChunksRef.current = []
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      audioStreamRef.current = stream
      setRecording(true)
      setRecordingPaused(false)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch (err) {
      toast.error("Impossible d'accéder au micro. Autorise l'accès dans ton navigateur.")
      console.error(err)
    }
  }

  const pauseRecording = () => {
    const r = mediaRecorderRef.current
    if (!r || !recording) return
    if (r.state === 'recording') {
      r.pause()
      setRecordingPaused(true)
      if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
    } else if (r.state === 'paused') {
      r.resume()
      setRecordingPaused(false)
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    }
  }

  const cancelRecording = () => {
    shouldSendRef.current = false
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    setRecordingPaused(false)
    setRecordingTime(0)
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
  }

  const sendRecording = () => {
    shouldSendRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    setRecordingPaused(false)
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 260px)' }}>
      {/* Messages */}
      <div className="flex-1 space-y-6 overflow-y-auto" style={{ paddingRight: '8px', paddingBottom: '24px' }}>
        {messages.length === 0 ? (
          <p className="text-sm text-blanc-muted py-12 text-center">Aucun message pour le moment.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUser
            const isEditing = editingId === msg.id
            const canEdit = isMe && !!msg.text && !msg.voiceUrl && !msg.fileUrl
            return (
              <div key={msg.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
              <div className="group relative w-fit max-w-[65%]">
                {/* Hover action bar : Repondre pour tous + Modifier/Supprimer pour mes messages */}
                <div
                  className={cn('absolute flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity')}
                  style={{ top: '-12px', [isMe ? 'right' : 'left']: '8px', zIndex: 5 }}
                >
                  <button
                    onClick={() => setReplyTo(msg)}
                    title="Répondre"
                    className="flex items-center justify-center rounded-md cursor-pointer"
                    style={{ width: '26px', height: '26px', background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
                    </svg>
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => { setEditingId(msg.id); setEditText(msg.text || '') }}
                      title="Modifier"
                      className="flex items-center justify-center rounded-md cursor-pointer"
                      style={{ width: '26px', height: '26px', background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                      </svg>
                    </button>
                  )}
                  {isMe && (
                    <button
                      onClick={() => setToDelete(msg)}
                      title="Supprimer"
                      className="flex items-center justify-center rounded-md cursor-pointer"
                      style={{ width: '26px', height: '26px', background: 'rgba(20,20,20,0.95)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  )}
                </div>

                {/* Quote du message cite si c'est une reponse */}
                {msg.replyToId && (() => {
                  const quoted = messages.find(m => m.id === msg.replyToId)
                  if (!quoted) return null
                  const quotedSender = quoted.sender === currentUser ? 'Vous' : otherUserName
                  const quotedPreview = quoted.text
                    ? (quoted.text.length > 80 ? quoted.text.slice(0, 79) + '…' : quoted.text)
                    : quoted.voiceUrl ? '🎤 Message vocal' : quoted.fileUrl ? '📎 Fichier joint' : 'Message supprimé'
                  return (
                    <div
                      onClick={() => { const el = document.getElementById('msg-' + quoted.id); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.style.transition = 'box-shadow 0.3s'; el.style.boxShadow = `0 0 0 2px ${accentColor}`; setTimeout(() => { el.style.boxShadow = '' }, 1200) } }}
                      className="cursor-pointer rounded-xl mb-1 opacity-70 hover:opacity-100 transition-opacity"
                      style={{ padding: '8px 12px', borderLeft: `2px solid ${accentColor}`, background: 'rgba(255,255,255,0.04)', fontSize: '12px' }}
                    >
                      <p className="text-[10px] uppercase tracking-wider text-blanc-muted/70" style={{ marginBottom: '2px' }}>{quotedSender}</p>
                      <p className="text-blanc-muted/80 truncate">{quotedPreview}</p>
                    </div>
                  )
                })()}

                <div
                  id={'msg-' + msg.id}
                  className="rounded-2xl"
                  style={{
                    padding: msg.voiceUrl ? '10px 14px' : (msg.text ? '14px 18px' : '8px'),
                    backgroundColor: isMe ? accentColor : 'var(--noir-elevated)',
                    color: isMe ? 'white' : 'var(--blanc)',
                  }}
                >
                  {/* Voice */}
                  {msg.voiceUrl && (
                    <AudioPlayer src={msg.voiceUrl} accentColor={accentColor} isMe={isMe} />
                  )}

                  {/* File */}
                  {msg.fileUrl && !msg.voiceUrl && (() => {
                    const isImage = /\.(png|jpe?g|gif|webp|bmp|svg|heic|heif)(\?|$)/i.test(msg.fileUrl)
                    if (isImage) {
                      return (
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(msg.fileUrl!)}
                          className="block cursor-zoom-in"
                          style={{ margin: '-4px -4px 4px', borderRadius: '12px', overflow: 'hidden', maxWidth: '280px', border: 'none', padding: 0, background: 'transparent' }}
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.text || 'Image'}
                            style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '360px', objectFit: 'cover', borderRadius: '12px' }}
                          />
                        </button>
                      )
                    }
                    return (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 underline text-sm"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                        </svg>
                        {msg.text || 'Fichier joint'}
                      </a>
                    )
                  })()}

                  {/* Text (or edit mode) */}
                  {msg.text && !msg.fileUrl && !msg.voiceUrl && (
                    isEditing ? (
                      <div>
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          autoFocus
                          rows={Math.max(1, editText.split('\n').length)}
                          className="w-full bg-transparent outline-none text-sm leading-relaxed resize-none"
                          style={{ color: isMe ? 'white' : 'var(--blanc)', minWidth: '220px' }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Escape') { setEditingId(null); setEditText(''); return }
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              const trimmed = editText.trim()
                              if (!trimmed || trimmed === msg.text) { setEditingId(null); return }
                              const ok = await updateMessage(msg.id, trimmed)
                              if (ok) {
                                setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text: trimmed, editedAt: new Date().toISOString() } : m))
                              }
                              setEditingId(null); setEditText('')
                            }
                          }}
                        />
                        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)' }}>
                          <span>Entrée pour valider</span>
                          <span>·</span>
                          <span>Echap pour annuler</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                    )
                  )}
                </div>
                <p className={cn('text-xs text-blanc-muted flex items-center gap-1.5', isMe ? 'justify-end text-right' : 'justify-start text-left')} style={{ marginTop: '8px' }}>
                  <span>
                    {isMe ? 'Vous' : otherUserName} · {formatMessageTime(msg.createdAt)}
                    {msg.editedAt && <span className="italic"> · modifié</span>}
                  </span>
                  {isMe && (msg.readAt ? (
                    <span title={`Lu le ${new Date(msg.readAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}`} style={{ color: '#ca8a04', display: 'inline-flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1.5 9l3 3 6-6" />
                        <path d="M7 12l3 3 7-7" />
                      </svg>
                    </span>
                  ) : (
                    <span title="Envoyé" style={{ color: 'rgba(255,255,255,0.35)', display: 'inline-flex', alignItems: 'center' }}>
                      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l4 4 8-8" />
                      </svg>
                    </span>
                  ))}
                </p>
              </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="text-xs text-blanc-muted">
            Message à {otherUserName}
          </p>
          {otherUserLastSeen !== undefined && (() => {
            if (!otherUserLastSeen) return <span className="text-[11px] text-blanc-muted/40">Jamais connecté</span>
            const d = new Date(otherUserLastSeen)
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
            else label = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
            const exact = d.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
            return (
              <span className="inline-flex items-center gap-1.5 text-[11px] text-blanc-muted/70" title={exact}>
                <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: online ? '#22c55e' : 'rgba(255,255,255,0.3)', boxShadow: online ? '0 0 8px rgba(34,197,94,0.6)' : 'none' }} />
                {otherUserName} · {label}
              </span>
            )
          })()}
        </div>

        {/* Bandeau 'Reponse a' */}
        {replyTo && (
          <div className="flex items-start gap-3 rounded-xl mb-2" style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderLeft: `2px solid ${accentColor}` }}>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-blanc-muted/70" style={{ marginBottom: '2px' }}>
                Réponse à {replyTo.sender === currentUser ? 'toi' : otherUserName}
              </p>
              <p className="text-sm text-blanc-muted/80 truncate">
                {replyTo.text || (replyTo.voiceUrl ? '🎤 Message vocal' : replyTo.fileUrl ? '📎 Fichier joint' : '')}
              </p>
            </div>
            <button onClick={() => setReplyTo(null)} aria-label="Annuler la reponse" className="flex items-center justify-center rounded-md text-blanc-muted/60 hover:text-blanc cursor-pointer" style={{ width: '24px', height: '24px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}

        <div className="bg-noir-elevated rounded-2xl" style={{ padding: '16px' }}>
          {recording ? (
            <div className="flex items-center justify-between gap-4 flex-wrap" style={{ padding: '16px' }}>
              <div className="flex items-center gap-3">
                <span className={cn('w-3 h-3 rounded-full', recordingPaused ? 'bg-blanc-muted/50' : 'bg-red-500 animate-pulse')} />
                <span className="text-sm text-blanc tabular-nums">
                  {recordingPaused ? 'En pause' : 'Enregistrement'} · {formatTime(recordingTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {/* Supprimer */}
                <button
                  onClick={cancelRecording}
                  title="Supprimer"
                  className="flex items-center justify-center rounded-xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  style={{ width: '44px', height: '44px', border: '1px solid rgba(248,113,113,0.25)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>

                {/* Pause / Reprendre */}
                <button
                  onClick={pauseRecording}
                  title={recordingPaused ? 'Reprendre' : 'Pause'}
                  className="flex items-center justify-center rounded-xl text-blanc hover:bg-white/5 transition-colors cursor-pointer"
                  style={{ width: '44px', height: '44px', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {recordingPaused ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M8 5v14l11-7L8 5z"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
                  )}
                </button>

                {/* Envoyer */}
                <button
                  onClick={sendRecording}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white rounded-xl cursor-pointer transition-transform active:scale-95"
                  style={{ backgroundColor: accentColor, padding: '12px 22px', letterSpacing: '0.02em' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
                  </svg>
                  Envoyer
                </button>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPaste={handlePaste}
                onInput={(e) => {
                  const el = e.currentTarget
                  el.style.height = 'auto'
                  el.style.height = Math.min(el.scrollHeight, 260) + 'px'
                }}
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = Math.min(Math.max(el.scrollHeight, 24), 260) + 'px'
                  }
                }}
                placeholder="Votre message..."
                className="w-full bg-transparent text-sm text-blanc placeholder:text-blanc-muted/50 outline-none leading-relaxed"
                style={{ resize: 'none', padding: '4px 8px', minHeight: '24px', maxHeight: '260px', overflowY: 'auto' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendText()
                  }
                }}
              />

              <div className="flex items-center justify-between" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="flex items-center justify-center rounded-lg text-blanc-muted hover:text-blanc transition-colors duration-200 cursor-pointer disabled:opacity-50"
                    style={{ width: '40px', height: '40px', backgroundColor: 'var(--noir-card)' }}
                    title="Joindre un fichier"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </button>
                  <button
                    onClick={startRecording}
                    disabled={sending}
                    className="flex items-center justify-center rounded-lg text-blanc-muted hover:text-blanc transition-colors duration-200 cursor-pointer disabled:opacity-50"
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
                <button
                  onClick={handleSendText}
                  disabled={sending || !text.trim()}
                  className="inline-flex items-center gap-2 text-sm font-medium rounded-xl cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ padding: '12px 24px', backgroundColor: accentColor, color: 'white' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                  </svg>
                  {sending ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </>
          )}
        </div>

        {whatsappPhone && (
          <p className="text-xs text-blanc-muted mt-3">Notification WhatsApp · {whatsappPhone}</p>
        )}
      </div>

      <ConfirmModal
        open={!!toDelete}
        danger
        title="Supprimer ce message ?"
        message="Cette action est définitive. Le message disparaîtra pour toi et pour ton interlocuteur."
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        cancelLabel="Annuler"
        onCancel={() => { if (!deleting) setToDelete(null) }}
        onConfirm={async () => {
          if (!toDelete || deleting) return
          setDeleting(true)
          const ok = await deleteMessage(toDelete.id)
          setDeleting(false)
          if (ok) setMessages(prev => prev.filter(m => m.id !== toDelete.id))
          setToDelete(null)
        }}
      />

      {/* Lightbox image (plein ecran, clic hors image pour fermer, Echap aussi) */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            key="lightbox"
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
            <a
              href={lightboxUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="absolute flex items-center justify-center rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
              style={{ top: '20px', right: '70px', width: '40px', height: '40px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
              aria-label="Ouvrir dans un nouvel onglet"
              title="Ouvrir dans un nouvel onglet"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
            </a>
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
    </div>
  )
}
