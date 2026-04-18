'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchMessages, sendMessage, uploadMessageFile, updateMessage, deleteMessage, type Message } from '@/lib/queries'
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
  whatsappPhone?: string
}

export default function MessageThread({ clientId, currentUser, accentColor, otherUserName, whatsappPhone }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [toDelete, setToDelete] = useState<Message | null>(null)
  const [deleting, setDeleting] = useState(false)
  const toast = useToast()
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load + subscribe + polling fallback
  useEffect(() => {
    let mounted = true
    const load = async () => {
      const msgs = await fetchMessages(clientId)
      if (!mounted) return
      setMessages(prev => {
        // Avoid re-render if nothing changed (length + last id + edit timestamps)
        if (
          prev.length === msgs.length &&
          prev.every((m, i) => m.id === msgs[i].id && m.editedAt === msgs[i].editedAt)
        ) return prev
        return msgs
      })
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
            text?: string; file_url?: string; voice_url?: string; created_at: string;
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
              } as Message,
            ]
          })
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
    const success = await sendMessage({ clientId, sender: currentUser, text: payload })
    if (success) {
      setText('')
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

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        setSending(true)
        const url = await uploadMessageFile(file)
        if (url) {
          await sendMessage({ clientId, sender: currentUser, voiceUrl: url })
          fetchMessages(clientId).then(setMessages)
          notifyCounterparty('Message vocal')
        }
        setSending(false)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      mediaRecorderRef.current = recorder
      setRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch (err) {
      toast.error("Impossible d'accéder au micro. Autorise l'accès dans ton navigateur.")
      console.error(err)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
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
                {/* Hover action bar (own messages only) */}
                {isMe && (
                  <div
                    className="absolute flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ top: '-12px', right: '8px', zIndex: 5 }}
                  >
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
                  </div>
                )}

                <div
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
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                          style={{ margin: '-4px -4px 4px', borderRadius: '12px', overflow: 'hidden', maxWidth: '280px' }}
                        >
                          <img
                            src={msg.fileUrl}
                            alt={msg.text || 'Image'}
                            style={{ display: 'block', width: '100%', height: 'auto', maxHeight: '360px', objectFit: 'cover', borderRadius: '12px' }}
                          />
                        </a>
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
                <p className={cn('text-xs text-blanc-muted', isMe ? 'text-right' : 'text-left')} style={{ marginTop: '8px' }}>
                  {isMe ? 'Vous' : otherUserName} · {formatMessageTime(msg.createdAt)}
                  {msg.editedAt && <span className="italic"> · modifié</span>}
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
        <p className="text-xs text-blanc-muted mb-4">
          Message à {otherUserName}
        </p>

        <div className="bg-noir-elevated rounded-2xl" style={{ padding: '16px' }}>
          {recording ? (
            <div className="flex items-center justify-between" style={{ padding: '16px' }}>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-sm text-blanc">Enregistrement... {formatTime(recordingTime)}</span>
              </div>
              <button
                onClick={stopRecording}
                className="text-sm font-medium text-white rounded-xl cursor-pointer transition-transform active:scale-95"
                style={{ backgroundColor: accentColor, padding: '14px 28px', letterSpacing: '0.02em' }}
              >
                Arrêter et envoyer
              </button>
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
    </div>
  )
}
