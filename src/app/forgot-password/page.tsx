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
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.10), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[900px] h-[900px] rounded-full blur-[220px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.06), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full"
          style={{ maxWidth: '480px' }}
        >
          {/* Brand */}
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h1 className="font-heading font-bold tracking-tight text-blanc leading-none" style={{ fontSize: 'clamp(48px, 8vw, 72px)' }}>
              Noir<span className="text-gold italic">sur</span>blanc
            </h1>
            <p className="text-blanc-muted/60 text-xs tracking-[0.35em] uppercase" style={{ marginTop: '20px' }}>
              Mot de passe oublié
            </p>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div
              className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.02)', padding: '44px 40px' }}
            >
              {sent ? (
                <>
                  <div className="flex items-center justify-center rounded-full border border-gold/20 mx-auto" style={{ width: '64px', height: '64px', background: 'rgba(202,138,4,0.12)', marginBottom: '24px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="font-heading text-blanc italic text-center" style={{ fontSize: '28px', marginBottom: '12px' }}>
                    Email envoyé
                  </h2>
                  <p className="text-blanc-muted/70 text-sm text-center leading-relaxed" style={{ marginBottom: '32px', padding: '0 4px' }}>
                    Si un compte existe pour <span className="text-blanc">{email}</span>, tu recevras un lien pour réinitialiser ton mot de passe dans quelques instants.
                  </p>
                  <Link
                    href="/login"
                    className="flex items-center justify-center gap-2 text-gold hover:text-gold-light text-xs tracking-[0.14em] uppercase transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                    Retour à la connexion
                  </Link>
                </>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className="font-heading text-blanc italic" style={{ fontSize: '28px', marginBottom: '8px' }}>
                    Réinitialiser
                  </h2>
                  <p className="text-blanc-muted/60 text-sm leading-relaxed" style={{ marginBottom: '36px' }}>
                    Entre ton email, on t&apos;envoie un lien pour choisir un nouveau mot de passe.
                  </p>

                  {/* Email */}
                  <div style={{ marginBottom: '28px' }}>
                    <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '12px' }}>
                      Email
                    </label>
                    <div className="relative">
                      <div className="absolute text-blanc-muted/35 pointer-events-none" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </div>
                      <input
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="ton@email.com"
                        className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl text-blanc text-[15px] placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.045] focus:shadow-[0_0_30px_rgba(202,138,4,0.06)] transition-all duration-300 outline-none"
                        style={{ padding: '16px 18px 16px 50px' }}
                      />
                    </div>
                  </div>

                  {err && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400/90 flex items-center gap-2"
                      style={{ marginBottom: '20px' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                      {err}
                    </motion.p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative flex items-center justify-center gap-3 w-full cursor-pointer disabled:opacity-40"
                    style={{ padding: '18px 40px' }}
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gold/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
                    <span className="relative z-10 text-noir font-semibold tracking-[0.14em] uppercase" style={{ fontSize: '13px' }}>
                      {loading ? 'Envoi…' : 'Envoyer le lien'}
                    </span>
                    {!loading && (
                      <svg className="relative z-10 text-noir group-hover:translate-x-1 transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Back link outside card (only when not sent) */}
          {!sent && (
            <p className="text-center text-sm text-blanc-muted/70" style={{ marginTop: '32px' }}>
              <Link href="/login" className="text-gold hover:text-gold-light underline underline-offset-4 decoration-gold/40 hover:decoration-gold transition-colors">
                ← Retour à la connexion
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
