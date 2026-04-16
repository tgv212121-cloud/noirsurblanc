// <!-- Integrated via Catalogue by Thomas Gildas (digitaltimes.fr) - 2026-04-16 -->
// Source : https://ui.aceternity.com/components/floating-dock
// Library : aceternity

'use client'

import { cn } from '@/lib/utils'
import {
  AnimatePresence,
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import Link from 'next/link'
import { useRef, useState } from 'react'

type DockItem = { title: string; icon: React.ReactNode; href: string; activeColor?: string }

export function FloatingDock({
  items,
  className,
}: {
  items: DockItem[]
  className?: string
}) {
  const mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        'mx-auto flex items-end gap-6 rounded-2xl px-6 pb-3 pt-3',
        className
      )}
      style={{
        background: 'rgba(20,20,20,0.8)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset',
      }}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  )
}

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  activeColor = '#ca8a04',
}: {
  mouseX: MotionValue<number>
  title: string
  icon: React.ReactNode
  href: string
  activeColor?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const widthTransform = useTransform(distance, [-150, 0, 150], [42, 72, 42])
  const heightTransform = useTransform(distance, [-150, 0, 150], [42, 72, 42])
  const widthIconT = useTransform(distance, [-150, 0, 150], [20, 36, 20])
  const heightIconT = useTransform(distance, [-150, 0, 150], [20, 36, 20])

  const width = useSpring(widthTransform, { mass: 0.1, stiffness: 150, damping: 12 })
  const height = useSpring(heightTransform, { mass: 0.1, stiffness: 150, damping: 12 })
  const widthIcon = useSpring(widthIconT, { mass: 0.1, stiffness: 150, damping: 12 })
  const heightIcon = useSpring(heightIconT, { mass: 0.1, stiffness: 150, damping: 12 })

  const [hovered, setHovered] = useState(false)

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{ width, height }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex aspect-square items-center justify-center"
      >
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 8, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 4, x: '-50%' }}
              transition={{ duration: 0.18 }}
              className="absolute -top-10 left-1/2 w-fit rounded-md px-2.5 py-1 text-[11px] whitespace-pre uppercase tracking-[0.12em]"
              style={{
                background: 'rgba(20,20,20,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: activeColor,
                fontWeight: 500,
              }}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          style={{ width, height }}
          className="relative z-10 flex items-center justify-center"
        >
          {icon}
        </motion.div>
      </motion.div>
    </Link>
  )
}
