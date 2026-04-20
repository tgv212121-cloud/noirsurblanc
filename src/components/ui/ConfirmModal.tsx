'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import Button from './Button'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full"
            style={{ maxWidth: '460px' }}
          >
            {/* Top highlight */}
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div
              className="relative rounded-3xl border border-white/[0.08] backdrop-blur-sm"
              style={{ background: 'rgba(20,20,20,0.98)', padding: '40px 40px 32px' }}
            >
              {/* Close X */}
              <button
                onClick={onCancel}
                aria-label="Fermer"
                className="absolute flex items-center justify-center rounded-lg text-blanc-muted hover:text-blanc cursor-pointer transition-colors"
                style={{ top: '14px', right: '14px', width: '32px', height: '32px' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>

              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-full mx-auto"
                style={{
                  width: '60px',
                  height: '60px',
                  background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(202,138,4,0.12)',
                  border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : 'rgba(202,138,4,0.3)'}`,
                  marginBottom: '26px',
                }}
              >
                {danger ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                )}
              </div>

              <h2
                className="font-heading text-blanc italic text-center"
                style={{ fontSize: '25px', marginBottom: '12px', lineHeight: 1.25 }}
              >
                {title}
              </h2>
              <p
                className="text-blanc-muted/75 text-sm text-center leading-relaxed"
                style={{ marginBottom: '32px', padding: '0 4px' }}
              >
                {message}
              </p>

              <div className="flex items-center gap-10px" style={{ gap: '10px' }}>
                <Button variant="secondary" onClick={onCancel} fullWidth style={{ padding: '14px 20px' }}>
                  {cancelLabel}
                </Button>
                <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} fullWidth style={{ padding: '14px 20px' }}>
                  {confirmLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
