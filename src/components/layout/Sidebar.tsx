'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Accueil', icon: DashboardIcon, color: '#2563eb' },
  { href: '/clients', label: 'Clients', icon: ClientsIcon, color: '#8b5cf6' },
  { href: '/analytics', label: 'Analytics', icon: AnalyticsIcon, color: '#059669' },
  { href: '/reminders', label: 'Rappels', icon: RemindersIcon, color: '#ea580c' },
]

export default function Sidebar() {
  const mouseX = useMotionValue(Infinity)
  const pathname = usePathname()

  // Hide dock on portal pages
  if (pathname.startsWith('/portal')) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <motion.nav
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '20px',
          boxShadow: '0 8px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.04)',
        }}
      >
        {NAV_ITEMS.map((item) => (
          <DockIcon key={item.href} mouseX={mouseX} {...item} />
        ))}
      </motion.nav>
    </div>
  )
}

function DockIcon({
  mouseX,
  href,
  label,
  icon: Icon,
  color,
}: {
  mouseX: MotionValue
  href: string
  label: string
  icon: () => React.JSX.Element
  color: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }
    return val - bounds.x - bounds.width / 2
  })

  const sizeSync = useTransform(distance, [-150, 0, 150], [48, 80, 48])
  const iconSync = useTransform(distance, [-150, 0, 150], [22, 36, 22])

  const size = useSpring(sizeSync, { mass: 0.1, stiffness: 170, damping: 14 })
  const iconSize = useSpring(iconSync, { mass: 0.1, stiffness: 170, damping: 14 })

  return (
    <Link href={href}>
      <motion.div
        ref={ref}
        style={{
          width: size,
          height: size,
          backgroundColor: isActive ? color : undefined,
          color: isActive ? 'white' : color,
        }}
        className={cn(
          'relative flex items-center justify-center rounded-2xl transition-colors duration-200',
          !isActive && 'bg-noir-elevated'
        )}
      >
        <motion.div
          style={{ width: iconSize, height: iconSize }}
          className="flex items-center justify-center"
        >
          <Icon />
        </motion.div>

        {/* Active dot */}
        {isActive && (
          <span
            className="absolute rounded-full"
            style={{ bottom: '-6px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: color }}
          />
        )}
      </motion.div>
    </Link>
  )
}

function DashboardIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  )
}
function ClientsIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function AnalyticsIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  )
}
function RemindersIcon() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
