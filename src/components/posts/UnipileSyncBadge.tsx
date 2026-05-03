'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'

type Props = {
  // Si fourni, on lit last_unipile_sync_at sur le client (vue admin sur fiche client)
  // Sinon on prend le user courant (vue client sur son portail)
  clientId?: string
}

function formatRelativeShort(iso: string | null | undefined): string {
  if (!iso) return 'jamais'
  const d = new Date(iso)
  const ms = Date.now() - d.getTime()
  if (ms < 60_000) return 'à l’instant'
  const min = Math.floor(ms / 60_000)
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  if (j < 7) return `il y a ${j} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function UnipileSyncBadge({ clientId }: Props) {
  const toast = useToast()
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [busy, setBusy] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  // tick force recompute du label "il y a X" toutes les 30s
  const [, setTick] = useState(0)
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 30_000); return () => clearInterval(id) }, [])

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession()
      const uid = sess.session?.user?.id || null
      setUserId(uid)

      if (clientId) {
        // Vue admin : on lit le client
        const { data } = await supabase.from('clients').select('last_unipile_sync_at, unipile_account_id').eq('id', clientId).maybeSingle()
        const r = data as { last_unipile_sync_at?: string; unipile_account_id?: string } | null
        setLastSync(r?.last_unipile_sync_at || null)
        setConnected(!!r?.unipile_account_id)
      } else if (uid) {
        // Vue client : on lit son profil
        const { data } = await supabase.from('profiles').select('last_unipile_sync_at, unipile_account_id').eq('id', uid).maybeSingle()
        const r = data as { last_unipile_sync_at?: string; unipile_account_id?: string } | null
        setLastSync(r?.last_unipile_sync_at || null)
        setConnected(!!r?.unipile_account_id)
      }
    })()
  }, [clientId])

  const sync = async () => {
    if (busy) return
    // Vue admin : on passe le clientId directement, le backend trouvera le compte Unipile
    // Vue client : on passe userId
    const payload: Record<string, string> = clientId ? { clientId } : (userId ? { userId } : {})
    if (!payload.clientId && !payload.userId) {
      toast.error('Impossible de déterminer le compte à synchroniser.')
      return
    }

    setBusy(true)
    try {
      const r = await fetch('/api/unipile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await r.json()
      if (!r.ok) {
        toast.error(d.error || 'Sync échec.')
        return
      }
      if (d.lastSyncAt) setLastSync(d.lastSyncAt)
      if (d.metricsUpserted > 0) {
        toast.success(`${d.metricsUpserted} posts synchronisés.`)
      } else if (d.postsFromUnipile === 0) {
        toast.info('Aucun nouveau post sur LinkedIn.')
      } else if (d.firstError) {
        toast.error(`Erreur metrics : ${d.firstError.slice(0, 200)}`)
      } else {
        toast.success('À jour.')
      }
      // Reload page si demande
    } catch {
      toast.error('Erreur réseau.')
    } finally {
      setBusy(false)
    }
  }

  if (!connected) return null

  return (
    <div className="inline-flex items-center gap-3 rounded-full" style={{ padding: '6px 6px 6px 14px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <span className="inline-flex items-center gap-1.5 text-[11px] text-blanc-muted/70">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Synchronisé {formatRelativeShort(lastSync)}
      </span>
      <button
        onClick={sync}
        disabled={busy}
        className="inline-flex items-center gap-1.5 rounded-full text-[11px] uppercase tracking-wider cursor-pointer transition-all disabled:opacity-50"
        style={{ padding: '6px 14px', background: '#ca8a04', color: '#0a0a0a', fontWeight: 600 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: busy ? 'spin 1s linear infinite' : 'none' }}>
          <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
        </svg>
        {busy ? 'Sync…' : 'Synchroniser'}
      </button>
    </div>
  )
}
