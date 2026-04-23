'use client'

import { useEffect, useState } from 'react'
import { ensureServiceWorker, getSupportState, isSubscribed, subscribeToPush, unsubscribeFromPush } from '@/lib/push-client'
import { useToast } from './Toast'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

export default function NotificationsSettingsCard() {
  const [state, setState] = useState<'unsupported' | 'default' | 'denied' | 'granted' | 'loading'>('loading')
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    (async () => {
      await ensureServiceWorker()
      setState(getSupportState())
      setSubscribed(await isSubscribed())
    })()
  }, [])

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
        toast.info('Notifications désactivées.')
      } else {
        if (isIOS() && !isStandalone()) {
          toast.warning("Sur iPhone, ajoute d'abord le site à ton écran d'accueil.")
          return
        }
        const ok = await subscribeToPush()
        setState(getSupportState())
        setSubscribed(ok)
        if (ok) toast.success('Notifications activées.')
        else toast.error("Impossible d'activer les notifications.")
      }
    } finally {
      setBusy(false)
    }
  }

  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const
  const unsupported = state === 'unsupported'
  const denied = state === 'denied'

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ ...cardStyle, marginBottom: '24px' }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
        <h2 className="font-heading text-lg text-blanc italic">Notifications</h2>
      </div>

      <div className="flex items-center justify-between gap-6 flex-wrap" style={{ padding: '24px' }}>
        <div className="flex-1" style={{ minWidth: '280px' }}>
          {subscribed && state === 'granted' ? (
            <>
              <div className="flex items-center gap-2" style={{ marginBottom: '6px' }}>
                <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#22c55e', boxShadow: '0 0 8px rgba(34,197,94,0.5)' }} />
                <p className="text-sm text-blanc font-medium">Notifications actives</p>
              </div>
              <p className="text-xs text-blanc-muted/70" style={{ marginTop: '6px', lineHeight: '1.6' }}>
                Tu reçois une alerte instantanée à chaque nouveau message ou nouveau post, même si le site est fermé.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-blanc/90 leading-relaxed" style={{ marginBottom: '8px' }}>
                {denied ? 'Notifications bloquées dans le navigateur' : unsupported ? 'Navigateur non compatible' : 'Active les notifications'}
              </p>
              <p className="text-xs text-blanc-muted/70 leading-relaxed">
                {denied
                  ? 'Pour les activer, va dans les paramètres de ton navigateur et autorise les notifications pour ce site.'
                  : unsupported
                    ? 'Ton navigateur ne supporte pas les notifications push.'
                    : "Reçois une alerte instantanée quand tu as un nouveau message ou un nouveau post, même si le site est fermé."}
              </p>
            </>
          )}
        </div>

        {!unsupported && !denied && (
          subscribed && state === 'granted' ? (
            <button onClick={toggle} disabled={busy}
              className="text-sm text-blanc-muted hover:text-red-400 cursor-pointer transition-colors disabled:opacity-40"
              style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              {busy ? '...' : 'Désactiver'}
            </button>
          ) : (
            <button onClick={toggle} disabled={busy} className="nsb-btn nsb-btn-primary" style={{ padding: '14px 24px' }}>
              {busy ? '...' : 'Activer'}
            </button>
          )
        )}
      </div>
    </div>
  )
}
