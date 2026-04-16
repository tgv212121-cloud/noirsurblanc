'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

const EASE_SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Clip-path reveal from bottom , not a fade
export function ClipReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
}: {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right'
}) {
  const clipFrom = direction === 'up'
    ? 'inset(100% 0 0 0)'
    : direction === 'left'
    ? 'inset(0 100% 0 0)'
    : 'inset(0 0 0 100%)'

  return (
    <motion.div
      className={className}
      initial={{ clipPath: clipFrom }}
      animate={{ clipPath: 'inset(0 0 0 0)' }}
      transition={{
        duration: 1.1,
        ease: EASE_SPRING,
        delay,
      }}
    >
      {children}
    </motion.div>
  )
}

// Stagger items with translateY reveal , IntersectionObserver style
export function StaggerItems({
  children,
  className = '',
  delay = 0,
  stagger = 0.06,
}: {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

// Individual stagger item
export function StaggerItem({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 28 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.7,
            ease: EASE_SPRING,
          },
        },
      }}
    >
      {children}
    </motion.div>
  )
}
