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
      if (opts.requireRole && p.role !== opts.requireRole) {
        // Admin can see client pages too, client cannot see admin pages
        if (opts.requireRole === 'admin') { router.push('/login'); return }
      }
      if (opts.requireClientId && p.role === 'client' && p.clientId !== opts.requireClientId) {
        router.push('/login'); return
      }
      setProfile(p); setChecking(false)
    })()
  }, [router, opts.requireRole, opts.requireClientId])

  return { profile, checking }
}
