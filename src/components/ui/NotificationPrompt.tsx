'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

export default function NotificationPrompt() {
  const [state, setState] = useState<'unsupported' | 'default' | 'denied' | 'granted' | 'loading'>('loading')
  const [subscribed, setSubscribed] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)
  const toast = useToast()

  useEffect(() => {
    (async () => {
      await ensureServiceWorker()
      const s = getSupportState()
      setState(s)
      setSubscribed(await isSubscribed())
      if (isIOS() && !isStandalone() && s !== 'unsupported') {
        setShowIosHint(true)
      }
    })()
  }, [])

  const handleEnable = async () => {
    if (isIOS() && !isStandalone()) {
      toast.warning("Sur iPhone, ajoute d'abord le site à ton écran d'accueil (partage → Sur l'écran d'accueil).")
      return
    }
    setState('loading')
    const ok = await subscribeToPush()
    const perm = getSupportState()
    setState(perm)
    setSubscribed(ok)
    if (ok) toast.success('Notifications activées.')
    else if (perm === 'denied') toast.error('Notifications refusées. Active-les dans les paramètres du navigateur.')
    else toast.error("Impossible d'activer les notifications.")
  }

  const handleDisable = async () => {
    await unsubscribeFromPush()
    setSubscribed(false)
    toast.info('Notifications désactivées.')
  }

  if (state === 'loading' || state === 'unsupported') return null

  // Deja active : on n'affiche plus rien en haut. La desactivation se fait depuis l'onglet Compte.
  if (subscribed && state === 'granted') return null

  // Non utilise directement mais laisse dispo pour d'autres contextes qui voudraient le handler
  void handleDisable

  // Show enable prompt
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="rounded-xl flex items-center gap-4 flex-wrap"
        style={{
          padding: '14px 18px',
          background: 'rgba(202,138,4,0.08)',
          border: '1px solid rgba(202,138,4,0.25)',
          marginBottom: '20px',
        }}
      >
        <div className="flex items-center justify-center shrink-0" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(202,138,4,0.15)', color: '#ca8a04' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>
        <div className="flex-1" style={{ minWidth: '200px' }}>
          <p className="text-sm text-blanc" style={{ marginBottom: '2px' }}>Active les notifications</p>
          <p className="text-xs text-blanc-muted/70">
            {showIosHint
              ? "Sur iPhone : Partage → « Sur l'écran d'accueil », puis ouvre l'app pour activer."
              : 'Reçois une alerte instantanée quand tu as un nouveau message ou un nouveau post, même si le site est fermé.'}
          </p>
        </div>
        {state !== 'denied' && (
          <button onClick={handleEnable} className="nsb-btn nsb-btn-primary" style={{ padding: '11px 22px', fontSize: '11px' }}>
            Activer
          </button>
        )}
        {state === 'denied' && (
          <span className="text-xs text-red-400/80">Bloqué dans le navigateur</span>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
