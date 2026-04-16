'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/queries'
import type { Client } from '@/types'

type Props = {
  open: boolean
  onClose: () => void
  onCreated: (client: Client, link: string) => void
}

export default function InviteClientModal({ open, onClose, onCreated }: Props) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setFirstName(''); setLastName(''); setEmail(''); setErr(null); setCreatedLink(null); setCopied(false)
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose, submitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!firstName.trim() || !lastName.trim()) { setErr('Renseigne le prénom et le nom.'); return }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Email invalide.'); return }

    setSubmitting(true)
    const c = await createClient({ name: fullName, company: '', email: email.trim() })
    setSubmitting(false)
    if (!c) { setErr('Impossible de créer le client. Réessaye.'); return }

    const link = `${window.location.origin}/onboarding?client=${c.id}`
    setCreatedLink(link)
    onCreated(c, link)
  }

  const handleCopy = async () => {
    if (!createdLink) return
    try {
      await navigator.clipboard.writeText(createdLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = createdLink
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    color: '#fafaf9',
    fontSize: '14px',
    padding: '14px 18px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
          onClick={() => { if (!submitting) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full"
            style={{ maxWidth: '480px' }}
          >
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div
              className="relative rounded-3xl border border-white/[0.08] backdrop-blur-sm"
              style={{ background: 'rgba(20,20,20,0.96)', padding: '36px 36px 32px' }}
            >
              {/* Close button */}
              <button
                onClick={() => { if (!submitting) onClose() }}
                className="absolute text-blanc-muted/40 hover:text-blanc cursor-pointer transition-colors"
                style={{ top: '18px', right: '18px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}
                aria-label="Fermer"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>

              {!createdLink ? (
                <>
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center rounded-full mx-auto"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(202,138,4,0.12)',
                      border: '1px solid rgba(202,138,4,0.25)',
                      marginBottom: '20px',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
                    </svg>
                  </div>

                  <h2 className="font-heading text-blanc italic text-center" style={{ fontSize: '26px', marginBottom: '8px' }}>
                    Inviter un client
                  </h2>
                  <p className="text-blanc-muted/65 text-sm text-center leading-relaxed" style={{ marginBottom: '28px', padding: '0 4px' }}>
                    Crée le compte, tu recevras un lien d&apos;onboarding à lui envoyer.
                  </p>

                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '16px' }}>
                      <div>
                        <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '10px' }}>Prénom</label>
                        <input type="text" required autoFocus value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Léa" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '10px' }}>Nom</label>
                        <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Fournier" style={inputStyle} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '10px' }}>Email</label>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="lea@fournier.com" style={inputStyle} />
                    </div>

                    {err && (
                      <p className="text-xs text-red-400/90 flex items-center gap-2" style={{ marginTop: '14px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                        {err}
                      </p>
                    )}

                    <div className="flex items-center gap-3" style={{ marginTop: '28px' }}>
                      <button
                        type="button"
                        onClick={() => { if (!submitting) onClose() }}
                        disabled={submitting}
                        className="flex-1 rounded-xl border border-white/[0.08] text-blanc text-sm font-medium hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors cursor-pointer disabled:opacity-40"
                        style={{ padding: '14px 20px' }}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="group relative flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                        style={{ padding: '14px 20px' }}
                      >
                        <div className="absolute inset-0 rounded-xl bg-gold/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
                        <span className="relative z-10 text-noir font-semibold tracking-[0.12em] uppercase" style={{ fontSize: '12px' }}>
                          {submitting ? 'Création…' : 'Créer & obtenir le lien'}
                        </span>
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  {/* Success */}
                  <div
                    className="flex items-center justify-center rounded-full mx-auto"
                    style={{
                      width: '56px',
                      height: '56px',
                      background: 'rgba(202,138,4,0.12)',
                      border: '1px solid rgba(202,138,4,0.25)',
                      marginBottom: '20px',
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>

                  <h2 className="font-heading text-blanc italic text-center" style={{ fontSize: '26px', marginBottom: '10px' }}>
                    Compte créé
                  </h2>
                  <p className="text-blanc-muted/65 text-sm text-center leading-relaxed" style={{ marginBottom: '24px', padding: '0 4px' }}>
                    Voici le lien à envoyer à {firstName} par WhatsApp, email ou Slack :
                  </p>

                  <div
                    className="rounded-xl text-xs text-blanc font-mono break-all"
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      marginBottom: '20px',
                      lineHeight: '1.5',
                    }}
                  >
                    {createdLink}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 rounded-xl border border-white/[0.08] text-blanc text-sm font-medium hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors cursor-pointer"
                      style={{ padding: '14px 20px' }}
                    >
                      Fermer
                    </button>
                    <button
                      onClick={handleCopy}
                      className="group relative flex-1 flex items-center justify-center gap-2 cursor-pointer"
                      style={{ padding: '14px 20px' }}
                    >
                      <div className="absolute inset-0 rounded-xl bg-gold/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: copied
                            ? 'linear-gradient(135deg,#059669,#10b981)'
                            : 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)',
                          border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(202,138,4,0.4)'}`,
                          transition: 'background 0.3s',
                        }}
                      />
                      <span className="relative z-10 text-noir font-semibold tracking-[0.12em] uppercase" style={{ fontSize: '12px' }}>
                        {copied ? '✓ Copié' : 'Copier le lien'}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
