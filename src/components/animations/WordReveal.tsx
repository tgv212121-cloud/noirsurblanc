'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

// Word-by-word clip-path reveal — Locomotive / Resn style
// Each word slides up from behind a mask
type Props = {
  children: string
  className?: string
  delay?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

const EASE_SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1]

export default function WordReveal({ children, className = '', delay = 0, as: Tag = 'h1' }: Props) {
  const words = children.split(' ')

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{
              duration: 0.9,
              ease: EASE_SPRING,
              delay: delay + i * 0.08,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </Tag>
  )
}

// Staggered children reveal — IntersectionObserver style but with Framer Motion
export function StaggerReveal({
  children,
  className = '',
  delay = 0,
  stagger = 0.08,
}: {
  children: ReactNode[]
  className?: string
  delay?: number
  stagger?: number
}) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: EASE_SPRING,
            delay: delay + i * stagger,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  )
}
