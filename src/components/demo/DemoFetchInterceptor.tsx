'use client'

import { useEffect } from 'react'
import { IS_DEMO_MODE } from '@/lib/demo/config'

// En mode demo, on intercepte tous les appels a /api/* pour les neutraliser.
// Aucun email envoye, aucun event Google cree, aucun push, aucun ping serveur.
export default function DemoFetchInterceptor() {
  useEffect(() => {
    if (!IS_DEMO_MODE) return
    if (typeof window === 'undefined') return
    const original = window.fetch
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : input.url)
      // Bloque les routes API internes en mode demo
      if (url.startsWith('/api/') || url.includes('/api/')) {
        return new Response(JSON.stringify({ ok: true, demo: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return original(input, init)
    }
    return () => { window.fetch = original }
  }, [])
  return null
}
