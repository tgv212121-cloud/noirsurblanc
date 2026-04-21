'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type AudioTrack = {
  src: string
  label?: string        // ex : "Message vocal · Thomas"
  avatarText?: string   // 1-2 lettres d'initiales
}

type Ctx = {
  track: AudioTrack | null
  playing: boolean
  current: number
  duration: number
  play: (t: AudioTrack) => void
  toggle: () => void
  stop: () => void
  seekTo: (t: number) => void
}

const AudioCtx = createContext<Ctx | null>(null)

export function useAudioPlayer(): Ctx {
  const c = useContext(AudioCtx)
  if (!c) {
    return {
      track: null, playing: false, current: 0, duration: 0,
      play: () => {}, toggle: () => {}, stop: () => {}, seekTo: () => {},
    }
  }
  return c
}

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [track, setTrack] = useState<AudioTrack | null>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (!audioRef.current) {
      const a = new Audio()
      a.preload = 'metadata'
      audioRef.current = a
    }
    const a = audioRef.current
    const onTime = () => setCurrent(a.currentTime || 0)
    const onMeta = () => setDuration(a.duration || 0)
    const onEnd = () => { setPlaying(false); setCurrent(0) }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnd)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnd)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
    }
  }, [])

  const play = (t: AudioTrack) => {
    const a = audioRef.current
    if (!a) return
    if (track?.src !== t.src) {
      setTrack(t)
      setCurrent(0); setDuration(0)
      a.src = t.src
    }
    a.play().catch(() => {})
  }

  const toggle = () => {
    const a = audioRef.current
    if (!a || !track) return
    if (a.paused) a.play().catch(() => {}); else a.pause()
  }

  const stop = () => {
    const a = audioRef.current
    if (a) { a.pause(); a.currentTime = 0 }
    setTrack(null); setPlaying(false); setCurrent(0); setDuration(0)
  }

  const seekTo = (t: number) => {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(duration || 0, t))
    setCurrent(a.currentTime)
  }

  return (
    <AudioCtx.Provider value={{ track, playing, current, duration, play, toggle, stop, seekTo }}>
      {children}
    </AudioCtx.Provider>
  )
}
