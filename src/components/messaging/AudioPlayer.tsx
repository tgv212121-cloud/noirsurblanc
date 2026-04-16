'use client'

import { useEffect, useRef, useState } from 'react'

type Props = {
  src: string
  accentColor: string
  isMe: boolean
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function AudioPlayer({ src, accentColor, isMe }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onLoaded = () => setDuration(a.duration || 0)
    const onTime = () => setCurrent(a.currentTime || 0)
    const onEnd = () => { setPlaying(false); setCurrent(0) }
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
    }
  }, [src])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    a.currentTime = Math.max(0, Math.min(duration, pct * duration))
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0
  const fg = isMe ? '#ffffff' : accentColor
  const fgSoft = isMe ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'

  return (
    <div className="flex items-center gap-3" style={{ minWidth: '240px', padding: '4px 6px 4px 4px' }}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={toggle}
        className="flex items-center justify-center shrink-0 cursor-pointer transition-transform active:scale-95"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: isMe ? 'rgba(255,255,255,0.2)' : accentColor,
          color: isMe ? '#ffffff' : '#ffffff',
          border: isMe ? '1px solid rgba(255,255,255,0.35)' : 'none',
        }}
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

      <div className="flex-1 flex flex-col justify-center gap-1.5" style={{ minWidth: '120px' }}>
        <div
          onClick={seek}
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
            {formatTime(current)}
          </span>
          <span className="text-[11px]" style={{ color: isMe ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.35)' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}
