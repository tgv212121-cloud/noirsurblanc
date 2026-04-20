'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './Toast'

type Props = {
  // Where to come back after OAuth. Default: current path
  returnTo?: string
  // Audience of the connection: admin (primary calendar for /book) or client (perso only)
  audience?: 'admin' | 'client'
}

export default function GoogleCalendarCard({ returnTo, audience = 'admin' }: Props) {
  const toast = useToast()
  const [status, setStatus] = useState<{ connected: boolean; email?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const getToken = async () => {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token || null
  }

  useEffect(() => {
    (async () => {
      const token = await getToken()
      if (!token) { setStatus({ connected: false }); return }
      const r = await fetch('/api/google/my-status', { headers: { Authorization: `Bearer ${token}` } })
      const d = await r.json()
      setStatus(d)
    })()
  }, [])

  const connect = async () => {
    setLoading(true)
    const token = await getToken()
    if (!token) { toast.error('Session invalide, reconnecte-toi.'); setLoading(false); return }
    const qs = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''
    const r = await fetch('/api/google/auth-url' + qs, { headers: { Authorization: `Bearer ${token}` } })
    const d = await r.json()
    if (d.url) window.location.href = d.url
    else { setLoading(false); toast.error("Impossible de générer l'URL Google.") }
  }

  const disconnect = async () => {
    if (!confirm('Déconnecter ton agenda Google ?')) return
    setLoading(true)
    const token = await getToken()
    if (!token) { setLoading(false); return }
    await fetch('/api/google/disconnect', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    setStatus({ connected: false })
    setLoading(false)
    toast.info('Agenda Google déconnecté.')
  }

  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const
  const adminCopy = {
    connected: 'Les nouveaux rendez-vous créent automatiquement un événement avec un lien Google Meet unique. Les créneaux déjà occupés dans ton agenda sont masqués pour les clients et prospects.',
    disconnected: 'Connecte ton agenda Google pour synchroniser les rendez-vous automatiquement. Chaque RDV crée un événement avec un lien Meet unique, et les créneaux déjà occupés disparaissent du calendrier public.',
  }
  const clientCopy = {
    connected: 'Les créneaux déjà pris dans ton agenda sont masqués quand tu réserves un appel avec ton copywriter. Ça évite les conflits.',
    disconnected: 'Connecte ton agenda Google pour que les créneaux déjà pris dans ton agenda soient automatiquement masqués quand tu réserves un appel.',
  }
  const copy = audience === 'admin' ? adminCopy : clientCopy

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ ...cardStyle, marginBottom: '24px' }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
        <h2 className="font-heading text-lg text-blanc italic">Google Calendar</h2>
      </div>

      <div className="flex items-center justify-between gap-6 flex-wrap" style={{ padding: '24px' }}>
        <div className="flex-1" style={{ minWidth: '280px' }}>
          {status?.connected ? (
            <>
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-sm text-blanc font-medium">Agenda connecté</p>
              </div>
              <p className="text-xs text-blanc-muted/70">{status.email}</p>
              <p className="text-xs text-blanc-muted/60" style={{ marginTop: '10px', lineHeight: '1.6' }}>{copy.connected}</p>
            </>
          ) : status ? (
            <>
              <p className="text-sm text-blanc/90 leading-relaxed" style={{ marginBottom: '8px' }}>Synchronise ton agenda Google</p>
              <p className="text-xs text-blanc-muted/70 leading-relaxed">{copy.disconnected}</p>
            </>
          ) : (
            <p className="text-sm text-blanc-muted">Chargement...</p>
          )}
        </div>

        {status?.connected ? (
          <button onClick={disconnect} disabled={loading}
            className="text-sm text-blanc-muted hover:text-red-400 cursor-pointer transition-colors disabled:opacity-40"
            style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            Déconnecter
          </button>
        ) : status ? (
          <button onClick={connect} disabled={loading} className="nsb-btn nsb-btn-primary" style={{ padding: '14px 24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm2 2v12h14V7H5zm2 2h4v4H7V9zm0 5h4v4H7v-4zm5-5h5v4h-5V9zm0 5h5v4h-5v-4z"/></svg>
            {loading ? 'Connexion…' : 'Connecter Google'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
