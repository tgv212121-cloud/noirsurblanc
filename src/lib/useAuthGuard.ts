'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyProfile, type Profile } from './auth'

type Options = {
  requireRole?: 'admin' | 'client'
  requireClientId?: string // for /portal/[id]
}

export function useAuthGuard(opts: Options = {}) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    (async () => {
      const p = await getMyProfile()
      if (!p) { router.push('/login'); return }
      // Role mismatch : redirect to user's own home (no loop to /login)
      if (opts.requireRole === 'admin' && p.role !== 'admin') {
        if (p.clientId) router.push(`/portal/${p.clientId}`)
        else router.push('/login')
        return
      }
      // Client trying to access another client's portal
      if (opts.requireClientId && p.role === 'client' && p.clientId !== opts.requireClientId) {
        if (p.clientId) router.push(`/portal/${p.clientId}`)
        else router.push('/login')
        return
      }
      setProfile(p); setChecking(false)
    })()
  }, [router, opts.requireRole, opts.requireClientId])

  return { profile, checking }
}
