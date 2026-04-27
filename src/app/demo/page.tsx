'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { setDemoAuth } from '@/lib/auth'
import { IS_DEMO_MODE, DEMO_ADMIN_ID, DEMO_CLIENTS_IDS } from '@/lib/demo/config'
import { resetDemo } from '@/lib/demo/store'

const PROFILES = [
  {
    id: DEMO_ADMIN_ID,
    role: 'admin' as const,
    label: 'Admin (Enzo)',
    desc: 'Gère 3 clients, leur calendrier, leurs posts. Vue 360°.',
    target: '/clients',
    accent: '#ca8a04',
  },
  {
    id: DEMO_CLIENTS_IDS[0],
    role: 'client' as const,
    label: 'Marie Dupont',
    desc: 'Cliente active. CEO Lumera. 4 posts publiés, 3 à valider.',
    target: `/portal/${DEMO_CLIENTS_IDS[0]}`,
    accent: '#8b5cf6',
  },
  {
    id: DEMO_CLIENTS_IDS[1],
    role: 'client' as const,
    label: 'Karim Lefebvre',
    desc: 'Consultant indépendant. Atelier 92. 2 RDV à venir.',
    target: `/portal/${DEMO_CLIENTS_IDS[1]}`,
    accent: '#22c55e',
  },
  {
    id: DEMO_CLIENTS_IDS[2],
    role: 'client' as const,
    label: 'Sophie Mercier',
    desc: 'Coach pro, fin d\'onboarding. Mercier Coaching.',
    target: `/portal/${DEMO_CLIENTS_IDS[2]}`,
    accent: '#3b82f6',
  },
]

export default function DemoLandingPage() {
  const router = useRouter()

  if (!IS_DEMO_MODE) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-heading text-3xl text-blanc italic">Mode démo désactivé</h1>
          <p className="text-sm text-blanc-muted/70" style={{ marginTop: '14px' }}>
            Cette page n'est disponible que sur la version demo de l'app. Active <code>NEXT_PUBLIC_DEMO_MODE=true</code> côté Vercel pour la version dédiée.
          </p>
          <Link href="/login" className="nsb-btn nsb-btn-primary inline-flex" style={{ marginTop: '24px', padding: '14px 28px' }}>
            Aller au login
          </Link>
        </div>
      </div>
    )
  }

  const enter = (p: (typeof PROFILES)[number]) => {
    setDemoAuth({
      id: p.id,
      email: p.label.toLowerCase().replace(/\s/g, '') + '@demo.fr',
      role: p.role,
      clientId: p.role === 'client' ? p.id : null,
    })
    router.push(p.target)
  }

  const onReset = () => {
    if (!confirm('Remettre la démo à zéro ? Tous les changements seront effacés.')) return
    resetDemo()
    setDemoAuth(null)
    location.reload()
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.10), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[900px] h-[900px] rounded-full blur-[220px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.06), transparent 70%)' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center w-full"
          style={{ maxWidth: '720px', marginBottom: '56px' }}
        >
          <p className="text-blanc-muted/60 text-[10px] tracking-[0.35em] uppercase" style={{ marginBottom: '14px' }}>
            Mode démo · données fictives
          </p>
          <h1 className="font-heading font-bold tracking-tight text-blanc leading-none" style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}>
            Noir<span className="text-gold italic">sur</span>blanc
          </h1>
          <p className="text-blanc-muted text-base md:text-lg leading-relaxed" style={{ maxWidth: '520px', margin: '32px auto 0' }}>
            Choisis un profil pour explorer l'interface. Tu peux cliquer partout, créer, modifier&nbsp;: tout reste local à ton navigateur.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full" style={{ maxWidth: '780px' }}>
          {PROFILES.map((p, i) => (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              onClick={() => enter(p)}
              className="text-left rounded-2xl cursor-pointer transition-all hover:-translate-y-1"
              style={{
                padding: '24px 26px',
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="flex items-center gap-2" style={{ marginBottom: '10px' }}>
                <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: p.accent, boxShadow: `0 0 10px ${p.accent}50` }} />
                <span className="text-[10px] uppercase tracking-[0.18em] text-blanc-muted/70">{p.role === 'admin' ? 'Espace admin' : 'Espace client'}</span>
              </div>
              <h2 className="font-heading italic text-blanc" style={{ fontSize: '22px', marginBottom: '8px', letterSpacing: '-0.01em' }}>{p.label}</h2>
              <p className="text-xs text-blanc-muted/70 leading-relaxed">{p.desc}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-blanc-muted/50" style={{ marginTop: '14px' }}>
                <span>Entrer</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Liens secondaires */}
        <div className="flex items-center flex-wrap justify-center" style={{ marginTop: '40px', gap: '24px' }}>
          <Link href="/onboarding" className="text-xs text-gold hover:text-gold-light underline underline-offset-4 decoration-gold/40 cursor-pointer">
            Tester le formulaire d&apos;onboarding →
          </Link>
          <button onClick={onReset} className="text-xs text-blanc-muted/40 hover:text-blanc-muted underline underline-offset-4 cursor-pointer">
            Remettre la démo à zéro
          </button>
        </div>

        <p className="text-[11px] text-blanc-muted/40 text-center" style={{ marginTop: '24px', maxWidth: '480px' }}>
          Aucune donnée n&apos;est envoyée. Tout vit dans le localStorage de ton navigateur.
        </p>
      </div>
    </div>
  )
}
