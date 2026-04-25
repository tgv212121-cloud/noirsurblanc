'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAudioPlayer } from '@/components/audio/AudioPlayerProvider'

type Props = {
  src: string
  accentColor: string
  isMe: boolean
  label?: string
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, accentColor, isMe, label }: Props) {
  const { track, playing, current, duration, play, toggle, seekTo } = useAudioPlayer()
  const isActive = track?.src === src

  // Probe la duree localement (sans jouer) pour l'afficher des le premier rendu,
  // meme si le track n'est pas le track actif du player global
  const [probedDuration, setProbedDuration] = useState(0)
  useEffect(() => {
    if (!src) return
    const a = new Audio()
    a.preload = 'metadata'
    a.src = src
    const onMeta = () => setProbedDuration(isFinite(a.duration) ? a.duration : 0)
    a.addEventListener('loadedmetadata', onMeta)
    return () => { a.removeEventListener('loadedmetadata', onMeta); a.src = '' }
  }, [src])

  const displayDuration = isActive ? duration : probedDuration
  const displayCurrent = isActive ? current : 0
  const isPlaying = isActive && playing

  const progress = displayDuration > 0 ? (displayCurrent / displayDuration) * 100 : 0

  const onToggle = () => {
    if (isActive) toggle()
    else play({ src, label: label || 'Message vocal' })
  }

  const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !displayDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seekTo(Math.max(0, Math.min(displayDuration, pct * displayDuration)))
  }

  const fg = isMe ? '#ffffff' : accentColor
  const fgSoft = isMe ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'

  const playerStyle = useMemo<React.CSSProperties>(() => ({ minWidth: '240px', padding: '4px 6px 4px 4px' }), [])

  return (
    <div className="flex items-center gap-3" style={playerStyle}>
      <button
        onClick={onToggle}
        className="flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isMe ? 'rgba(255,255,255,0.2)' : accentColor,
          color: '#ffffff',
          border: isMe ? '1px solid rgba(255,255,255,0.35)' : 'none',
        }}
        aria-label={isPlaying ? 'Pause' : 'Lire'}
      >
        {isPlaying ? (
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

      <div className="flex-1 flex flex-col justify-center gap-1.5" style={{ minWidth: '120px' }}>
        <div
          onClick={onSeek}
          className="relative cursor-pointer"
          style={{ height: '4px', background: fgSoft, borderRadius: '999px' }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0, top: 0, bottom: 0,
              width: `${progress}%`,
              background: fg,
              borderRadius: '999px',
              transition: 'width 0.1s linear',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: `${progress}%`,
              top: '50%',
              transform: 'translate(-50%,-50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: fg,
              boxShadow: '0 0 0 2px rgba(0,0,0,0.15)',
              opacity: progress > 0 ? 1 : 0,
              transition: 'opacity 0.2s',
            }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ fontVariantNumeric: 'tabular-nums' }}>
          <span className="text-[11px]" style={{ color: isMe ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)' }}>
            {formatTime(displayCurrent)}
          </span>
          <span className="text-[11px]" style={{ color: isMe ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)' }}>
            {formatTime(displayDuration)}
          </span>
        </div>
      </div>
    </div>
  )
}
