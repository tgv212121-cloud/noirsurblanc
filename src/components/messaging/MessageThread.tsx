'use client'

import { useState, useEffect, useRef } from 'react'
import { fetchMessages, sendMessage, uploadMessageFile, type Message } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { formatRelative, cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [recording, setRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load messages on mount
  useEffect(() => {
    fetchMessages(clientId).then(setMessages)
  }, [clientId])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${clientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${clientId}` },
        (payload) => {
          const newMsg = payload.new as any
          setMessages((prev) => [
            ...prev,
            {
              id: newMsg.id,
              clientId: newMsg.client_id,
              sender: newMsg.sender,
              text: newMsg.text,
              fileUrl: newMsg.file_url,
              voiceUrl: newMsg.voice_url,
              createdAt: newMsg.created_at,
            },
          ])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [clientId])

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendText = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const success = await sendMessage({ clientId, sender: currentUser, text: text.trim() })
    if (success) setText('')
    setSending(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSending(true)
    const url = await uploadMessageFile(file)
    if (url) {
      await sendMessage({ clientId, sender: currentUser, fileUrl: url, text: file.name })
    }
    setSending(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      alert("Impossible d'accéder au micro. Autorise l'accès dans ton navigateur.")
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
    <div>
      {/* Messages */}
      <div className="space-y-8 mb-12 max-h-[500px] overflow-y-auto" style={{ paddingRight: '8px' }}>
        {messages.length === 0 ? (
          <p className="text-sm text-blanc-muted py-12 text-center">Aucun message pour le moment.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender === currentUser
            return (
              <div key={msg.id} className={cn('max-w-[75%]', isMe ? 'ml-auto' : 'mr-auto')}>
                <div
                  className="rounded-2xl"
                  style={{
                    padding: msg.text || msg.voiceUrl ? '16px 20px' : '8px',
                    backgroundColor: isMe ? accentColor : 'var(--noir-elevated)',
                    color: isMe ? 'white' : 'var(--blanc)',
                  }}
                >
                  {/* Voice */}
                  {msg.voiceUrl && (
                    <audio controls src={msg.voiceUrl} className="w-full" style={{ minWidth: '240px' }} />
                  )}

                  {/* File */}
                  {msg.fileUrl && !msg.voiceUrl && (
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
                  )}

                  {/* Text */}
                  {msg.text && !msg.fileUrl && (
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  )}
                </div>
                <p className={cn('text-xs text-blanc-muted', isMe ? 'text-right' : 'text-left')} style={{ marginTop: '8px' }}>
                  {isMe ? 'Vous' : otherUserName} · {formatRelative(msg.createdAt)}
                </p>
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
                className="px-5 py-2 text-sm font-medium text-white rounded-lg cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Arrêter et envoyer
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Votre message..."
                rows={3}
                className="w-full bg-transparent text-sm text-blanc placeholder:text-blanc-muted/50 outline-none leading-relaxed"
                style={{ resize: 'none', padding: '4px 8px' }}
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
    </div>
  )
}
