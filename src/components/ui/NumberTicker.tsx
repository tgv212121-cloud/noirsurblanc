// <!-- Integrated via Catalogue by Thomas Gildas (digitaltimes.fr) — 2026-04-17 -->
// Source : https://magicui.design/docs/components/number-ticker
// Library : magic-ui
'use client'

import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  value: number
  direction?: 'up' | 'down'
  delay?: number
  className?: string
  decimalPlaces?: number
  suffix?: string
}

export default function NumberTicker({
  value,
  direction = 'up',
  delay = 0,
  className,
  decimalPlaces = 0,
  suffix = '',
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === 'down' ? value : 0)
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (!isInView) return
    const t = setTimeout(() => {
      motionValue.set(direction === 'down' ? 0 : value)
    }, delay * 1000)
    return () => clearTimeout(t)
  }, [isInView, motionValue, direction, value, delay])

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (!ref.current) return
      const fixed = Number(latest).toFixed(decimalPlaces)
      ref.current.textContent = Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: decimalPlaces,
        maximumFractionDigits: decimalPlaces,
      }).format(Number(fixed)) + suffix
    })
  }, [springValue, decimalPlaces, suffix])

  return (
    <span ref={ref} className={cn('inline-block tabular-nums', className)}>
      {direction === 'down' ? value : 0}{suffix}
    </span>
  )
}
