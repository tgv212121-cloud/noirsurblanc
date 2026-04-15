'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { updatePassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  // Supabase attache automatiquement la session via le #access_token dans l'URL
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true)
      }
    })
    // Vérifie aussi la session existante
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    // Si au bout de 2s rien → ready quand même pour laisser l'utilisateur tenter
    const t = setTimeout(() => setReady(true), 2000)
    return () => { listener.subscription.unsubscribe(); clearTimeout(t) }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    if (password.length < 6) { setErr('Mot de passe trop court (6 caractères minimum).'); return }
    if (password !== confirm) { setErr('Les deux mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) { setErr(error); return }
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
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
          <div className="text-center" style={{ marginBottom: '56px' }}>
            <h1 className="font-heading font-bold tracking-tight text-blanc leading-none" style={{ fontSize: 'clamp(48px, 8vw, 72px)' }}>
              Noir<span className="text-gold italic">sur</span>blanc
            </h1>
            <p className="text-blanc-muted/60 text-xs tracking-[0.35em] uppercase" style={{ marginTop: '20px' }}>
              Nouveau mot de passe
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.02)', padding: '44px 40px' }}>

              {done ? (
                <>
                  <div className="flex items-center justify-center rounded-full border border-gold/20 mx-auto" style={{ width: '64px', height: '64px', background: 'rgba(202,138,4,0.12)', marginBottom: '24px' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="font-heading text-blanc italic text-center" style={{ fontSize: '28px', marginBottom: '12px' }}>
                    Mot de passe modifié
                  </h2>
                  <p className="text-blanc-muted/70 text-sm text-center leading-relaxed">
                    Redirection vers la connexion…
                  </p>
                </>
              ) : !ready ? (
                <p className="text-blanc-muted/60 text-sm text-center py-8">Vérification du lien…</p>
              ) : (
                <form onSubmit={handleSubmit}>
                  <h2 className="font-heading text-blanc italic" style={{ fontSize: '28px', marginBottom: '8px' }}>
                    Choisis ton nouveau mot de passe
                  </h2>
                  <p className="text-blanc-muted/60 text-sm leading-relaxed" style={{ marginBottom: '36px' }}>
                    6 caractères minimum. Utilise quelque chose que tu retiendras.
                  </p>

                  {/* New password */}
                  <div style={{ marginBottom: '20px' }}>
                    <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '12px' }}>
                      Nouveau mot de passe
                    </label>
                    <div className="relative">
                      <div className="absolute text-blanc-muted/35 pointer-events-none" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <input type={showPwd ? 'text' : 'password'} required autoFocus value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl text-blanc text-[15px] placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.045] focus:shadow-[0_0_30px_rgba(202,138,4,0.06)] transition-all duration-300 outline-none"
                        style={{ padding: '16px 50px 16px 50px' }} />
                      <button type="button" onClick={() => setShowPwd(v => !v)}
                        className="absolute text-blanc-muted/50 hover:text-blanc transition-colors cursor-pointer"
                        style={{ right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
                        {showPwd ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm */}
                  <div style={{ marginBottom: '8px' }}>
                    <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '12px' }}>
                      Confirmer
                    </label>
                    <div className="relative">
                      <div className="absolute text-blanc-muted/35 pointer-events-none" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <input type={showPwd ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl text-blanc text-[15px] placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.045] focus:shadow-[0_0_30px_rgba(202,138,4,0.06)] transition-all duration-300 outline-none"
                        style={{ padding: '16px 18px 16px 50px' }} />
                    </div>
                  </div>

                  {err && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400/90 flex items-center gap-2"
                      style={{ marginTop: '18px' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                      {err}
                    </motion.p>
                  )}

                  <button type="submit" disabled={loading}
                    className="group relative flex items-center justify-center gap-3 w-full cursor-pointer disabled:opacity-40"
                    style={{ padding: '18px 40px', marginTop: '32px' }}>
                    <div className="absolute inset-0 rounded-2xl bg-gold/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
                    <span className="relative z-10 text-noir font-semibold tracking-[0.14em] uppercase" style={{ fontSize: '13px' }}>
                      {loading ? 'Mise à jour…' : 'Mettre à jour'}
                    </span>
                  </button>
                </form>
              )}
            </div>
          </div>

          {!done && (
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
