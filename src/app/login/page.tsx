'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { signIn, getMyProfile } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setErr(null); setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setErr("Connexion Google impossible. Réessaye."); setGoogleLoading(false) }
  }

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
              Espace privé
            </p>
          </div>

          {/* Card */}
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] via-transparent to-transparent pointer-events-none" />
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <form
              onSubmit={handleLogin}
              className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm"
              style={{ background: 'rgba(255,255,255,0.02)', padding: '44px 40px' }}
            >
              <h2 className="font-heading text-blanc italic" style={{ fontSize: '28px', marginBottom: '8px' }}>
                Connexion
              </h2>
              <p className="text-blanc-muted/60 text-sm leading-relaxed" style={{ marginBottom: '36px' }}>
                Entre tes identifiants pour accéder à ton espace.
              </p>

              {/* Email */}
              <div style={{ marginBottom: '22px' }}>
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

              {/* Password */}
              <div style={{ marginBottom: '8px' }}>
                <label className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.18em] block" style={{ marginBottom: '12px' }}>
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute text-blanc-muted/35 pointer-events-none" style={{ left: '18px', top: '50%', transform: 'translateY(-50%)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/[0.025] border border-white/[0.08] rounded-xl text-blanc text-[15px] placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.045] focus:shadow-[0_0_30px_rgba(202,138,4,0.06)] transition-all duration-300 outline-none"
                    style={{ padding: '16px 50px 16px 50px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute text-blanc-muted/50 hover:text-blanc transition-colors cursor-pointer"
                    style={{ right: '16px', top: '50%', transform: 'translateY(-50%)' }}
                    aria-label={showPwd ? 'Masquer' : 'Afficher'}
                  >
                    {showPwd ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot password */}
              <div className="text-right" style={{ marginBottom: '24px' }}>
                <Link href="/forgot-password" className="text-xs text-blanc-muted/60 hover:text-gold transition-colors">
                  Mot de passe oublié&nbsp;?
                </Link>
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
                  {loading ? 'Connexion…' : 'Se connecter'}
                </span>
                {!loading && (
                  <svg className="relative z-10 text-noir group-hover:translate-x-1 transition-transform duration-300" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                )}
              </button>

              {/* Separateur ou */}
              <div className="flex items-center gap-3" style={{ margin: '22px 0' }}>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <span className="text-[10px] text-blanc-muted/50 uppercase tracking-[0.2em]">ou</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>

              {/* Google sign-in */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                className="relative flex items-center justify-center gap-3 w-full cursor-pointer disabled:opacity-40 transition-colors hover:bg-white/[0.04]"
                style={{ padding: '16px 24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}
              >
                {googleLoading ? (
                  <span className="text-sm text-blanc-muted">Ouverture de Google…</span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm text-blanc font-medium">Continuer avec Google</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Onboarding link (outside card) */}
          <p className="text-center text-sm text-blanc-muted/70" style={{ marginTop: '32px' }}>
            Pas encore de compte&nbsp;?{' '}
            <Link href="/onboarding" className="text-gold hover:text-gold-light underline underline-offset-4 decoration-gold/40 hover:decoration-gold transition-colors">
              Voici ton lien d&apos;onboarding
            </Link>
          </p>

          {/* Legal footer */}
          <div className="flex items-center justify-center gap-4 flex-wrap" style={{ marginTop: '40px' }}>
            <Link href="/mentions-legales" className="text-[11px] text-blanc-muted/40 hover:text-blanc-muted tracking-[0.1em] uppercase transition-colors">Mentions légales</Link>
            <span className="text-blanc-muted/20">·</span>
            <Link href="/confidentialite" className="text-[11px] text-blanc-muted/40 hover:text-blanc-muted tracking-[0.1em] uppercase transition-colors">Confidentialité</Link>
            <span className="text-blanc-muted/20">·</span>
            <Link href="/cgu" className="text-[11px] text-blanc-muted/40 hover:text-blanc-muted tracking-[0.1em] uppercase transition-colors">CGU</Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
