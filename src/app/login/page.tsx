'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getMyProfile } from '@/lib/auth'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setErr(error); setLoading(false); return }
    const profile = await getMyProfile()
    setLoading(false)
    if (!profile) { setErr('Profil introuvable.'); return }
    if (profile.role === 'admin') router.push('/clients')
    else if (profile.clientId) router.push(`/portal/${profile.clientId}`)
    else router.push('/')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-6">
      {/* Ambient background */}
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
        {/* Brand */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-5xl md:text-6xl font-bold tracking-tight text-blanc leading-none">
            Noir<span className="text-gold italic">sur</span>blanc
          </h1>
          <p className="text-blanc-muted/60 text-[11px] tracking-[0.3em] uppercase mt-4">Espace privé</p>
        </div>

        {/* Card */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          <form onSubmit={handleLogin}
            className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm px-8 py-10"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            <h2 className="font-heading text-2xl font-medium text-blanc italic mb-1">Connexion</h2>
            <p className="text-blanc-muted/50 text-sm mb-8">Entre tes identifiants pour accéder à ton espace.</p>

            {/* Email */}
            <div className="mb-5">
              <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-2.5">Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blanc-muted/30 pointer-events-none">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </div>
                <input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ton@email.com"
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl pl-11 pr-4 py-3.5 text-blanc text-sm placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.04] focus:shadow-[0_0_30px_rgba(202,138,4,0.05)] transition-all duration-300 outline-none" />
              </div>
            </div>

            {/* Password */}
            <div className="mb-2">
              <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-2.5">Mot de passe</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blanc-muted/30 pointer-events-none">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <input type={showPwd ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl pl-11 pr-12 py-3.5 text-blanc text-sm placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.04] focus:shadow-[0_0_30px_rgba(202,138,4,0.05)] transition-all duration-300 outline-none" />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blanc-muted/40 hover:text-blanc transition-colors cursor-pointer">
                  {showPwd ? (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {err && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400/90 mt-4 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {err}
              </motion.p>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="group relative flex items-center justify-center gap-3 w-full px-10 py-4 cursor-pointer disabled:opacity-40 mt-8">
              <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
              <span className="relative z-10 text-noir font-semibold text-[13px] tracking-[0.14em] uppercase">
                {loading ? 'Connexion…' : 'Se connecter'}
              </span>
              {!loading && (
                <svg className="relative z-10 text-noir group-hover:translate-x-1 transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              )}
            </button>

            <p className="text-blanc-muted/30 text-[10px] tracking-widest uppercase text-center mt-8">
              Pas encore de compte ? Demande ton lien d&apos;onboarding.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
