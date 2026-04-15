'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { sendResetEmail } from '@/lib/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setLoading(true)
    const { error } = await sendResetEmail(email.trim())
    setLoading(false)
    if (error) { setErr(error); return }
    setSent(true)
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.08), transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-40 w-[700px] h-[700px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.05), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight text-blanc leading-none">
            Noir<span className="text-gold italic">sur</span>blanc
          </h1>
          <p className="text-blanc-muted/60 text-[11px] tracking-[0.3em] uppercase mt-4">Mot de passe oublié</p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <form onSubmit={handleSubmit}
            className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm px-8 py-10"
            style={{ background: 'rgba(255,255,255,0.02)' }}>

            {sent ? (
              <>
                <div className="flex items-center justify-center w-14 h-14 rounded-full border border-gold/20 mx-auto mb-5" style={{ background: 'rgba(202,138,4,0.1)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h2 className="font-heading text-2xl font-medium text-blanc italic text-center mb-2">Email envoyé</h2>
                <p className="text-blanc-muted/70 text-sm text-center leading-relaxed mb-8">
                  Si un compte existe pour <span className="text-blanc">{email}</span>, tu recevras un lien pour réinitialiser ton mot de passe dans quelques instants.
                </p>
                <Link href="/login"
                  className="block text-center text-xs text-gold hover:text-gold-light transition-colors tracking-widest uppercase">
                  ← Retour à la connexion
                </Link>
              </>
            ) : (
              <>
                <h2 className="font-heading text-2xl font-medium text-blanc italic mb-1">Réinitialiser</h2>
                <p className="text-blanc-muted/50 text-sm mb-8">Entre ton email, on t&apos;envoie un lien pour choisir un nouveau mot de passe.</p>

                <div className="mb-2">
                  <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-2.5">Email</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blanc-muted/30 pointer-events-none">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="ton@email.com"
                      className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl pl-11 pr-4 py-3.5 text-blanc text-sm placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.04] focus:shadow-[0_0_30px_rgba(202,138,4,0.05)] transition-all duration-300 outline-none" />
                  </div>
                </div>

                {err && (
                  <p className="text-xs text-red-400/90 mt-4 flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                    {err}
                  </p>
                )}

                <button type="submit" disabled={loading}
                  className="group relative flex items-center justify-center gap-3 w-full px-10 py-4 cursor-pointer disabled:opacity-40 mt-8">
                  <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
                  <span className="relative z-10 text-noir font-semibold text-[13px] tracking-[0.14em] uppercase">
                    {loading ? 'Envoi…' : 'Envoyer le lien'}
                  </span>
                </button>

                <Link href="/login"
                  className="block text-center text-xs text-blanc-muted/50 hover:text-gold transition-colors mt-6">
                  ← Retour à la connexion
                </Link>
              </>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  )
}
