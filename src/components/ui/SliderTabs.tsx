'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type TabItem = { id: string; label: string }

type Props = {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
}

// Tabs avec curseur dore qui glisse (design valide par Enzo sur localhost:4000/enzo-preview.html)
export default function SliderTabs({ items, value, onChange, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [slider, setSlider] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  const updateSlider = () => {
    const btn = btnRefs.current[value]
    const container = containerRef.current
    if (!btn || !container) return
    const r = btn.getBoundingClientRect()
    const p = container.getBoundingClientRect()
    setSlider({ left: r.left - p.left, width: r.width })
  }

  useLayoutEffect(() => {
    updateSlider()
    // Re-mesure apres le prochain frame (au cas ou la police n'est pas encore appliquee)
    const id = requestAnimationFrame(updateSlider)
    return () => cancelAnimationFrame(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, items.length])

  useEffect(() => {
    const onResize = () => updateSlider()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-flex', className)}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '4px',
        borderRadius: '12px',
        gap: '2px',
      }}
    >
      {/* Slider dore */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: '4px',
          bottom: '4px',
          left: slider.left + 'px',
          width: slider.width + 'px',
          background: '#ca8a04',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(202,138,4,0.25)',
          transition: 'left .35s cubic-bezier(0.22, 1, 0.36, 1), width .35s cubic-bezier(0.22, 1, 0.36, 1)',
          zIndex: 0,
        }}
      />

      {items.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            ref={(el) => { btnRefs.current[t.id] = el }}
            onClick={() => onChange(t.id)}
            className="relative cursor-pointer transition-colors"
            style={{
              padding: '9px 18px',
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: active ? '#0a0a0a' : 'rgba(255,255,255,0.65)',
              fontWeight: active ? 600 : 500,
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'inherit',
              zIndex: 1,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
