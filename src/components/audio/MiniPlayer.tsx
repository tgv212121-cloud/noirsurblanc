'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAudioPlayer } from './AudioPlayerProvider'

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MiniPlayer() {
  const { track, playing, current, duration, toggle, stop, seekTo } = useAudioPlayer()

  const progress = duration > 0 ? (current / duration) * 100 : 0

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seekTo(Math.max(0, Math.min(duration, pct * duration)))
  }

  return (
    <AnimatePresence>
      {track && (
        <motion.div
          key="mini-player"
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed z-[80] flex items-center gap-3"
          style={{
            bottom: '28px',
            right: '28px',
            minWidth: '320px',
            maxWidth: '420px',
            padding: '12px 14px 12px 14px',
            background: 'rgba(20,20,20,0.98)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '14px',
            boxShadow: '0 18px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(202,138,4,0.08) inset',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Bouton play/pause */}
          <button
            onClick={toggle}
            className="flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95"
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ca8a04', color: '#0a0a0a' }}
            aria-label={playing ? 'Pause' : 'Lire'}
          >
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                <path d="M7 5v14l12-7z" />
              </svg>
            )}
          </button>

          {/* Label + barre */}
          <div className="flex-1 min-w-0 flex flex-col gap-1" style={{ overflow: 'hidden' }}>
            <p className="text-[12px] text-blanc truncate" style={{ fontWeight: 500 }}>
              {track.label || 'Message vocal'}
            </p>
            <div
              onClick={onSeek}
              className="relative cursor-pointer"
              style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px' }}
            >
              <div
                style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${progress}%`, background: '#ca8a04',
                  borderRadius: '999px', transition: 'width 0.1s linear',
                }}
              />
            </div>
            <div className="flex items-center justify-between" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <span className="text-[10px] text-blanc-muted/70">{formatTime(current)}</span>
              <span className="text-[10px] text-blanc-muted/50">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={stop}
            aria-label="Fermer"
            className="shrink-0 flex items-center justify-center rounded-md text-blanc-muted/70 hover:text-blanc cursor-pointer transition-colors"
            style={{ width: '26px', height: '26px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
