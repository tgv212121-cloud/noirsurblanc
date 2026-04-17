'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getMyProfile } from '@/lib/auth'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      // Supabase-js (avec detectSessionInUrl activé par défaut) échange automatiquement
      // le code OAuth contre une session lors du chargement du module. Il suffit d'attendre
      // que getSession renvoie une session valide.
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        setErr("Connexion Google échouée. Réessaye ou utilise ton email/mot de passe.")
        setTimeout(() => router.replace('/login'), 2500)
        return
      }
      const p = await getMyProfile()
      if (!p) {
        setErr("Aucun compte n'est associé à cet email Google. Contacte ton copywriter.")
        await supabase.auth.signOut()
        setTimeout(() => router.replace('/login'), 3500)
        return
      }
      if (p.role === 'admin') router.replace('/clients')
      else if (p.clientId) router.replace(`/portal/${p.clientId}`)
      else router.replace('/')
    })()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-[#ca8a04]/20 border-t-[#ca8a04] animate-spin" />
        <p className="text-sm text-blanc-muted/70" style={{ marginTop: '20px' }}>
          {err || 'Connexion en cours…'}
        </p>
      </div>
    </div>
  )
}
