// <!-- Integrated via Catalogue by Thomas Gildas (digitaltimes.fr) — 2026-04-17 -->
// Source : https://magicui.design/docs/components/magic-card
// Library : magic-ui
'use client'

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion'
import { useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  children?: React.ReactNode
  className?: string
  gradientSize?: number
  gradientColor?: string
  gradientOpacity?: number
  gradientFrom?: string
  gradientTo?: string
}

export default function MagicCard({
  children,
  className,
  gradientSize = 240,
  gradientColor = 'rgba(202,138,4,0.18)',
  gradientOpacity = 0.9,
  gradientFrom = 'rgba(202,138,4,0.55)',
  gradientTo = 'rgba(234,179,8,0.25)',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(-gradientSize)
  const mouseY = useMotionValue(-gradientSize)

  const onMove = useCallback((e: MouseEvent) => {
    if (!ref.current) return
    const { left, top } = ref.current.getBoundingClientRect()
    mouseX.set(e.clientX - left)
    mouseY.set(e.clientY - top)
  }, [mouseX, mouseY])

  const onLeave = useCallback(() => {
    mouseX.set(-gradientSize)
    mouseY.set(-gradientSize)
  }, [mouseX, mouseY, gradientSize])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    return () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    }
  }, [onMove, onLeave])

  const spotlight = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)`
  const borderSpotlight = useMotionTemplate`radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientFrom}, ${gradientTo}, transparent 100%)`

  return (
    <div
      ref={ref}
      className={cn(
        'group relative rounded-2xl overflow-hidden',
        className,
      )}
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      {/* Animated border */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: borderSpotlight, opacity: gradientOpacity }}
      />
      {/* Inner mask */}
      <div
        className="absolute inset-px rounded-2xl"
        style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.06)' }}
      />
      {/* Spotlight fill */}
      <motion.div
        className="pointer-events-none absolute inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: spotlight }}
      />
      <div className="relative">{children}</div>
    </div>
  )
}
