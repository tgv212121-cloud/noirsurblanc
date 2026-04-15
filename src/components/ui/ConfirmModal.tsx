'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  confirmText?: string
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
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full"
            style={{ maxWidth: '460px' }}
          >
            {/* Top highlight */}
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            <div
              className="relative rounded-3xl border border-white/[0.08] backdrop-blur-sm"
              style={{ background: 'rgba(20,20,20,0.96)', padding: '36px 36px 28px' }}
            >
              {/* Icon */}
              <div
                className="flex items-center justify-center rounded-full mx-auto"
                style={{
                  width: '56px',
                  height: '56px',
                  background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(202,138,4,0.12)',
                  border: `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(202,138,4,0.25)'}`,
                  marginBottom: '24px',
                }}
              >
                {danger ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                    <path d="M12 9v4"/><path d="M12 17h.01"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                  </svg>
                )}
              </div>

              <h2
                className="font-heading text-blanc italic text-center"
                style={{ fontSize: '24px', marginBottom: '12px' }}
              >
                {title}
              </h2>
              <p
                className="text-blanc-muted/75 text-sm text-center leading-relaxed"
                style={{ marginBottom: '32px', padding: '0 4px' }}
              >
                {message}
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 rounded-xl border border-white/[0.08] text-blanc text-sm font-medium hover:bg-white/[0.03] hover:border-white/[0.15] transition-colors cursor-pointer"
                  style={{ padding: '14px 20px' }}
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className="group relative flex-1 flex items-center justify-center gap-2 cursor-pointer"
                  style={{ padding: '14px 20px' }}
                >
                  <div
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: danger
                        ? 'linear-gradient(135deg,#b91c1c,#dc2626,#ef4444)'
                        : 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)',
                      border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'rgba(202,138,4,0.4)'}`,
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                    style={{
                      background: danger ? 'rgba(239,68,68,0.3)' : 'rgba(202,138,4,0.3)',
                    }}
                  />
                  <span
                    className="relative z-10 font-semibold uppercase tracking-[0.12em]"
                    style={{ fontSize: '12px', color: danger ? '#fff' : '#0a0a0a' }}
                  >
                    {confirmLabel}
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
