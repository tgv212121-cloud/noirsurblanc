'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type ToastKind = 'info' | 'success' | 'error' | 'warning'
type ToastItem = { id: number; kind: ToastKind; message: string }

type ToastCtx = {
  show: (message: string, kind?: ToastKind) => void
  success: (m: string) => void
  error: (m: string) => void
  warning: (m: string) => void
  info: (m: string) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx)
  if (!ctx) {
    // Fallback silently no-op to avoid crashes if used before provider mounts
    return {
      show: (m) => console.warn('[toast fallback]', m),
      success: (m) => console.warn('[toast fallback]', m),
      error: (m) => console.warn('[toast fallback]', m),
      warning: (m) => console.warn('[toast fallback]', m),
      info: (m) => console.warn('[toast fallback]', m),
    }
  }
  return ctx
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const remove = useCallback((id: number) => {
    setItems(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = Date.now() + Math.random()
    setItems(prev => [...prev, { id, kind, message }])
    setTimeout(() => remove(id), 5000)
  }, [remove])

  const value: ToastCtx = {
    show,
    success: (m: string) => show(m, 'success'),
    error: (m: string) => show(m, 'error'),
    warning: (m: string) => show(m, 'warning'),
    info: (m: string) => show(m, 'info'),
  }

  return (
    <Ctx.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={remove} />
    </Ctx.Provider>
  )
}

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {items.map((t) => (
          <ToastLine key={t.id} item={t} onDismiss={() => onDismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastLine({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const colors: Record<ToastKind, { border: string; dot: string; text: string; icon: React.ReactNode }> = {
    info: {
      border: 'rgba(202,138,4,0.3)',
      dot: '#ca8a04',
      text: '#ca8a04',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
    },
    success: {
      border: 'rgba(34,197,94,0.3)',
      dot: '#22c55e',
      text: '#86efac',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    },
    error: {
      border: 'rgba(239,68,68,0.35)',
      dot: '#ef4444',
      text: '#fca5a5',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
    },
    warning: {
      border: 'rgba(245,158,11,0.35)',
      dot: '#f59e0b',
      text: '#fcd34d',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    },
  }
  const c = colors[item.kind]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.96 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-start gap-3"
      style={{
        pointerEvents: 'auto',
        background: 'rgba(20,20,20,0.96)',
        border: `1px solid ${c.border}`,
        borderRadius: '14px',
        padding: '14px 18px 14px 16px',
        minWidth: '280px',
        maxWidth: '420px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 14px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset',
      }}
    >
      <div className="flex items-center justify-center shrink-0" style={{ width: '24px', height: '24px', color: c.dot, marginTop: '1px' }}>
        {c.icon}
      </div>
      <p className="flex-1 text-sm leading-relaxed" style={{ color: '#fafaf9' }}>{item.message}</p>
      <button
        onClick={onDismiss}
        className="shrink-0 opacity-40 hover:opacity-80 transition-opacity cursor-pointer"
        style={{ color: '#fafaf9', marginTop: '1px' }}
        aria-label="Fermer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </motion.div>
  )
}
