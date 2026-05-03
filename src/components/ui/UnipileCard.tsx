'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from './Toast'

type Props = {
  audience?: 'admin' | 'client'
}

export default function UnipileCard({ audience = 'client' }: Props) {
  const toast = useToast()
  const [userId, setUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<{ connected: boolean; accountId?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession()
      const uid = sess.session?.user?.id || null
      setUserId(uid)
      if (!uid) { setStatus({ connected: false }); return }
      try {
        const r = await fetch(`/api/unipile/status?userId=${encodeURIComponent(uid)}`)
        const d = await r.json()
        setStatus(d)
      } catch {
        setStatus({ connected: false })
      }
    })()
  }, [])

  const connect = async () => {
    if (!userId) { toast.error('Session invalide. Reconnecte-toi.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/unipile/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      const d = await r.json()
      if (!r.ok || !d.url) {
        // Affiche le detail Unipile pour qu'on diagnostique
        const msg = d.detail
          ? `Unipile : ${d.detail.slice(0, 200)}`
          : (d.error || 'Impossible de générer le lien Unipile.')
        toast.error(msg)
        console.error('[Unipile connect failed]', d)
        setLoading(false)
        return
      }
      // Redirige vers le hosted auth link Unipile
      window.location.href = d.url
    } catch (e) {
      toast.error('Erreur réseau.')
      console.error('[Unipile connect network]', e)
      setLoading(false)
    }
  }

  const disconnect = async () => {
    if (!userId) return
    if (!confirm('Déconnecter ton LinkedIn de Unipile&nbsp;? Les statistiques ne seront plus mises à jour.')) return
    setLoading(true)
    try {
      await fetch('/api/unipile/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
      setStatus({ connected: false })
      toast.info('LinkedIn déconnecté.')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const

  const adminCopy = {
    connected: 'Tes posts LinkedIn sont automatiquement synchronisés (impressions, likes, commentaires) toutes les heures. Les insights de performance dans l’onglet Stats sont alimentés par ces données.',
    disconnected: 'Connecte ton compte LinkedIn pour synchroniser automatiquement tes posts et leurs métriques (impressions, likes, commentaires) sans saisie manuelle.',
  }
  const clientCopy = {
    connected: 'Ton LinkedIn est connecté. Tes statistiques de posts apparaitront dans l’onglet Stats.',
    disconnected: 'Connecte ton LinkedIn pour que tes performances de posts soient automatiquement synchronisées (impressions, likes, commentaires).',
  }
  const copy = audience === 'admin' ? adminCopy : clientCopy

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ ...cardStyle, marginBottom: '24px' }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#0a66c2', boxShadow: '0 0 10px rgba(10,102,194,0.5)' }} />
        <h2 className="font-heading text-lg text-blanc italic">LinkedIn (statistiques auto)</h2>
      </div>
      <div className="flex items-center justify-between gap-6 flex-wrap" style={{ padding: '24px' }}>
        <div className="flex-1" style={{ minWidth: '280px' }}>
          {status?.connected ? (
            <>
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-sm text-blanc font-medium">LinkedIn connecté</p>
              </div>
              <p className="text-xs text-blanc-muted/60" style={{ marginTop: '10px', lineHeight: '1.6' }}>{copy.connected}</p>
            </>
          ) : status ? (
            <>
              <p className="text-sm text-blanc/90 leading-relaxed" style={{ marginBottom: '8px' }}>Synchronise tes statistiques LinkedIn</p>
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
            {loading ? '...' : 'Déconnecter'}
          </button>
        ) : status ? (
          <button onClick={connect} disabled={loading} className="nsb-btn nsb-btn-primary" style={{ padding: '14px 24px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#0a0a0a"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 110-4.12 2.06 2.06 0 010 4.12zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45C23.2 24 24 23.23 24 22.28V1.72C24 .77 23.2 0 22.22 0z"/></svg>
            {loading ? 'Connexion…' : 'Connecter LinkedIn'}
          </button>
        ) : null}
      </div>
    </div>
  )
}
