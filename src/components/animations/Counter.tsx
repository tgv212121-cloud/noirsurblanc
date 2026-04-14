'use client'

import { useEffect, useState, useRef } from 'react'

// Counter animation — Linear / Vercel style
// Numbers count up to target with easeOutCubic
type Props = {
  target: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  className?: string
  delay?: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

export default function Counter({
  target,
  duration = 1800,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
  delay = 0,
}: Props) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return
      started.current = true
      const startTime = performance.now()

      const step = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        setValue(easeOutCubic(t) * target)
        if (t < 1) requestAnimationFrame(step)
        else setValue(target)
      }

      requestAnimationFrame(step)
    }, delay)

    return () => clearTimeout(timeout)
  }, [target, duration, delay])

  const formatted = decimals > 0
    ? value.toFixed(decimals)
    : Math.round(value).toString()

  return (
    <span className={className}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

// Format large numbers (K, M)
export function CounterFormatted({
  target,
  className = '',
  delay = 0,
}: {
  target: number
  className?: string
  delay?: number
}) {
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (started.current) return
      started.current = true
      const startTime = performance.now()
      const duration = 1800

      const step = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1)
        setValue(easeOutCubic(t) * target)
        if (t < 1) requestAnimationFrame(step)
        else setValue(target)
      }

      requestAnimationFrame(step)
    }, delay)

    return () => clearTimeout(timeout)
  }, [target, delay])

  const format = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return Math.round(n).toString()
  }

  return <span className={className}>{format(value)}</span>
}
