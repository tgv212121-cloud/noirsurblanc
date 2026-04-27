'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyProfile, type Profile } from './auth'
import { IS_DEMO_MODE } from './demo/config'

type Options = {
  requireRole?: 'admin' | 'client'
  requireClientId?: string // for /portal/[id]
}

export function useAuthGuard(opts: Options = {}) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let stopPing: (() => void) | null = null
    ;(async () => {
      const p = await getMyProfile()
      if (!p) { router.push(IS_DEMO_MODE ? '/demo' : '/login'); return }
      // Role mismatch : redirect to user's own home (no loop to /login)
      if (opts.requireRole === 'admin' && p.role !== 'admin') {
        if (p.clientId) router.push(`/portal/${p.clientId}`)
        else router.push(IS_DEMO_MODE ? '/demo' : '/login')
        return
      }
      // Client trying to access another client's portal
      if (opts.requireClientId && p.role === 'client' && p.clientId !== opts.requireClientId) {
        if (p.clientId) router.push(`/portal/${p.clientId}`)
        else router.push(IS_DEMO_MODE ? '/demo' : '/login')
        return
      }
      setProfile(p); setChecking(false)

      // Ping de presence admin (toutes les 60s + au retour de visibilite)
      if (p.role === 'admin') {
        const ping = () => {
          fetch('/api/presence/admin-ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: p.id }),
          }).catch(() => {})
        }
        ping()
        const interval = setInterval(ping, 60_000)
        const onVisible = () => { if (document.visibilityState === 'visible') ping() }
        document.addEventListener('visibilitychange', onVisible)
        stopPing = () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisible) }
      }
    })()
    return () => { if (stopPing) stopPing() }
  }, [router, opts.requireRole, opts.requireClientId])

  return { profile, checking }
}
