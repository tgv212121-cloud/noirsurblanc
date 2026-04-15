'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, getMyProfile } from '@/lib/auth'
import { motion } from 'framer-motion'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setLoading(true)
    const { error } = await signIn(email, password)
    if (error) { setErr(error); setLoading(false); return }
    const profile = await getMyProfile()
    setLoading(false)
    if (!profile) { setErr("Profil introuvable."); return }
    if (profile.role === 'admin') router.push('/clients')
    else if (profile.clientId) router.push(`/portal/${profile.clientId}`)
    else router.push('/')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <h1 className="text-4xl md:text-5xl font-heading font-bold tracking-tight text-blanc text-center mb-2">
          Noir<span className="text-gold italic">sur</span>blanc
        </h1>
        <p className="text-blanc-muted text-xs tracking-[0.2em] uppercase text-center mb-10">Connexion</p>

        <form onSubmit={handleLogin} className="rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm px-8 py-10 space-y-5">
          <div>
            <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-2">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-5 py-3.5 text-blanc text-sm placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.04] transition-all duration-300 outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-2">Mot de passe</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-5 py-3.5 text-blanc text-sm placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.04] transition-all duration-300 outline-none" />
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          <button type="submit" disabled={loading}
            className="group relative flex items-center justify-center gap-3 w-full px-10 py-4 cursor-pointer disabled:opacity-40 mt-2">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
            <span className="relative z-10 text-noir font-semibold text-sm tracking-wide uppercase">
              {loading ? 'Connexion...' : 'Se connecter'}
            </span>
          </button>
        </form>
      </motion.div>
    </div>
  )
}
