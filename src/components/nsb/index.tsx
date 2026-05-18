/* eslint-disable react/no-unescaped-entities */
// ============================================================
// Noirsurblanc — Composants principaux (export depuis @/components/nsb)
// Stack : Next.js 16 + React 19 + Tailwind v4
// Tokens dans src/app/globals.css
// ============================================================
'use client'

import * as React from 'react'
import { Play, Pause } from 'lucide-react'

/* ============================================================
 * 1. Button
 * ============================================================ */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'icon'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  leading?: React.ReactNode
  trailing?: React.ReactNode
}

const BTN_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'relative overflow-hidden text-noir border border-gold/50 bg-[linear-gradient(135deg,#a16207_0%,#ca8a04_50%,#eab308_100%)] hover:shadow-gold before:absolute before:inset-0 before:bg-[linear-gradient(100deg,transparent_20%,rgba(255,255,255,0.4)_50%,transparent_80%)] before:-translate-x-[110%] before:transition-transform before:duration-700 hover:before:translate-x-[110%]',
  secondary:
    'bg-transparent text-blanc border border-white/15 hover:bg-white/[0.04] hover:border-white/25',
  danger:
    'text-white border border-red-500/45 bg-[linear-gradient(135deg,#b91c1c,#dc2626,#ef4444)] hover:shadow-[0_8px_28px_rgba(239,68,68,0.35)]',
  icon:
    'w-10 h-10 rounded-[10px] bg-white/[0.03] border border-border text-blanc-muted hover:text-blanc hover:bg-white/[0.06] hover:border-gold/35 p-0',
}

const BTN_SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-[18px] py-[10px] text-[11px]',
  md: 'min-h-[44px] px-[26px] py-[13px] text-[12px]',
  lg: 'min-h-[52px] px-[32px] py-[16px] text-[13px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leading,
  trailing,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const isIcon = variant === 'icon'
  return (
    <button
      {...rest}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold uppercase tracking-[0.12em]',
        'transition-[transform,box-shadow,background,border-color] active:translate-y-px',
        'disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer font-body',
        BTN_VARIANT[variant],
        !isIcon && BTN_SIZE[size],
        fullWidth && 'w-full',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {leading}
      <span className="relative z-10">{children}</span>
      {trailing}
    </button>
  )
}

/* ============================================================
 * 2. KPI Card
 * ============================================================ */
export interface KPIProps {
  label: string
  value: React.ReactNode
  meta?: React.ReactNode
  dotColor?: string
  valueColor?: string
  accent?: boolean
}

export function KPI({ label, value, meta, dotColor = '#ca8a04', valueColor, accent }: KPIProps) {
  return (
    <div
      className={[
        'relative overflow-hidden rounded-xl border px-[26px] py-[22px]',
        accent
          ? 'border-accent-client/25 bg-[linear-gradient(135deg,rgba(139,92,246,0.10),rgba(139,92,246,0.02))]'
          : 'border-white/10 bg-white/[0.025]',
      ].join(' ')}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]"
      />

      <div className="mb-[10px] flex items-center gap-2">
        <span
          className="inline-block h-[5px] w-[5px] rounded-full"
          style={{ background: dotColor, boxShadow: `0 0 8px ${dotColor}99` }}
        />
        <span className="text-[11px] uppercase tracking-[0.18em] text-blanc-muted/70">{label}</span>
      </div>

      <div
        className={[
          'font-heading italic font-medium leading-none tracking-[-0.02em]',
          'text-[var(--fs-display)]',
          valueColor || 'text-blanc',
        ].join(' ')}
      >
        {value}
      </div>

      {meta && <div className="mt-2 text-[11px] text-blanc-muted/60">{meta}</div>}
    </div>
  )
}

/* ============================================================
 * 3. Message Bubble
 * ============================================================ */
export type MessageKind = 'text' | 'voice' | 'image'
export type MessageRole = 'admin' | 'client'

export interface MessageBubbleProps {
  kind?: MessageKind
  text?: string
  imageUrl?: string
  voiceDuration?: number
  sender: MessageRole
  currentUser: MessageRole
  senderName: string
  timestamp: string | Date
  read?: boolean
  onImageClick?: (url: string) => void
}

const SENDER_COLOR: Record<MessageRole, string> = {
  admin: '#2563eb',
  client: '#8b5cf6',
}

export function MessageBubble({
  kind = 'text',
  text,
  imageUrl,
  voiceDuration = 0,
  sender,
  currentUser,
  senderName,
  timestamp,
  read,
  onImageClick,
}: MessageBubbleProps) {
  const isMe = sender === currentUser
  const time = new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const bubbleColor = isMe ? SENDER_COLOR[sender] : undefined
  const bubbleClass = isMe ? 'text-white' : 'bg-noir-elevated text-blanc'

  let body: React.ReactNode
  if (kind === 'voice') {
    body = <VoicePlayer duration={voiceDuration} />
  } else if (kind === 'image' && imageUrl) {
    body = (
      <button
        type="button"
        onClick={() => onImageClick?.(imageUrl)}
        className="block cursor-zoom-in overflow-hidden rounded-xl border-0 bg-transparent p-0"
        style={{ margin: '-4px -4px 4px', maxWidth: 280 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="block h-auto w-full rounded-xl object-cover" style={{ maxHeight: 360 }} />
      </button>
    )
  } else {
    body = <p className="m-0 whitespace-pre-line text-[14px] leading-[1.55]">{text}</p>
  }

  return (
    <div className={['flex', isMe ? 'justify-end' : 'justify-start'].join(' ')}>
      <div className="max-w-[85%] sm:max-w-[72%]">
        <div
          className={[
            'rounded-[18px]',
            kind === 'voice' ? 'px-[14px] py-[10px]' : kind === 'image' ? 'p-[6px]' : 'px-[18px] py-[14px]',
            bubbleClass,
          ].join(' ')}
          style={isMe ? { background: bubbleColor } : undefined}
        >
          {body}
        </div>
        <p
          className={[
            'mt-2 flex items-center gap-[6px] text-[11px] text-blanc-muted/55',
            isMe ? 'justify-end' : 'justify-start',
          ].join(' ')}
        >
          <span>
            {isMe ? 'Vous' : senderName} · {time}
          </span>
          {isMe && (
            <span
              title={read ? 'Lu' : 'Envoyé'}
              className="inline-flex"
              style={{ color: read ? '#ca8a04' : 'rgba(255,255,255,0.35)' }}
            >
              {read ? (
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.5 9l3 3 6-6" />
                  <path d="M7 12l3 3 7-7" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l4 4 8-8" />
                </svg>
              )}
            </span>
          )}
        </p>
      </div>
    </div>
  )
}

function VoicePlayer({ duration }: { duration: number }) {
  const [playing, setPlaying] = React.useState(false)
  const [progress] = React.useState(0.35)
  const bars = [8, 14, 20, 10, 22, 18, 14, 24, 12, 8, 16, 10, 20, 14, 8, 18, 12, 6, 16, 20, 12, 8]
  return (
    <div className="flex min-w-[260px] items-center gap-3">
      <button
        onClick={() => setPlaying((p) => !p)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white"
      >
        {playing ? <Pause size={14} /> : <Play size={14} />}
      </button>
      <div className="flex h-7 flex-1 items-center gap-[2px]">
        {bars.map((h, i) => {
          const filled = i / bars.length < progress
          return (
            <span
              key={i}
              className="rounded-[1px]"
              style={{
                width: 2,
                height: h,
                background: filled ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
              }}
            />
          )
        })}
      </div>
      <span className="min-w-[32px] text-right font-mono text-[11px] text-white/85">
        0:{String(duration).padStart(2, '0')}
      </span>
    </div>
  )
}

/* ============================================================
 * 4. Calendar Day
 * ============================================================ */
export type DayStatus = 'empty' | 'pending' | 'validated'

export interface CalendarDayProps {
  day: number
  status?: DayStatus
  isToday?: boolean
  isSelected?: boolean
  onClick?: () => void
}

export function CalendarDay({ day, status = 'empty', isToday, isSelected, onClick }: CalendarDayProps) {
  const hasPost = status !== 'empty'
  const validated = status === 'validated'
  const dotColor = validated ? '#22c55e' : '#ea580c'
  const bg = hasPost
    ? validated
      ? 'rgba(34,197,94,0.06)'
      : 'rgba(234,88,12,0.06)'
    : isToday
      ? 'var(--noir-elevated)'
      : 'transparent'

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'relative min-h-[44px] rounded-xl border-0 text-center font-body text-[13px] transition-colors',
        hasPost ? 'font-semibold text-blanc' : 'text-blanc-muted/70',
      ].join(' ')}
      style={{
        background: bg,
        boxShadow: isSelected ? 'inset 0 0 0 2px #8b5cf6' : 'none',
        cursor: 'pointer',
        padding: '12px 0',
      }}
    >
      {day}
      {hasPost && (
        <span
          aria-hidden
          className="absolute bottom-[6px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full"
          style={{
            background: dotColor,
            boxShadow: validated ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
          }}
        />
      )}
    </button>
  )
}

/* ============================================================
 * 5. Slider Tabs
 * ============================================================ */
export interface TabItem {
  id: string
  label: string
}

export interface SliderTabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export function SliderTabs({ items, value, onChange, className = '' }: SliderTabsProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const btnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const [slider, setSlider] = React.useState({ left: 0, width: 0 })

  const measure = React.useCallback(() => {
    const btn = btnRefs.current[value]
    const wrap = wrapRef.current
    if (!btn || !wrap) return
    const r = btn.getBoundingClientRect()
    const p = wrap.getBoundingClientRect()
    setSlider({ left: r.left - p.left, width: r.width })
  }, [value])

  React.useLayoutEffect(() => {
    measure()
    const id = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(id)
  }, [measure, items.length])

  React.useEffect(() => {
    const fn = () => measure()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [measure])

  return (
    <div
      className={[
        'max-w-full touch-pan-x overflow-x-auto nsb-no-scrollbar',
        className,
      ].join(' ')}
    >
      <div
        ref={wrapRef}
        className="relative inline-flex gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-[6px]"
      >
        <span
          aria-hidden
          className="absolute z-0 rounded-lg bg-gold shadow-[0_4px_12px_rgba(202,138,4,0.25)]"
          style={{
            top: 6,
            bottom: 6,
            left: slider.left,
            width: slider.width,
            transition:
              'left 350ms cubic-bezier(0.22, 1, 0.36, 1), width 350ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        />
        {items.map((t) => {
          const active = t.id === value
          return (
            <button
              key={t.id}
              ref={(el) => {
                btnRefs.current[t.id] = el
              }}
              onClick={() => onChange(t.id)}
              className={[
                'relative z-10 min-h-[44px] whitespace-nowrap rounded-lg border-0 bg-transparent px-7 py-[11px]',
                'font-body text-[12px] uppercase tracking-[0.08em] cursor-pointer transition-colors',
                active ? 'font-semibold text-noir' : 'font-medium text-blanc/65 hover:text-blanc',
              ].join(' ')}
            >
              {t.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================
 * Helpers
 * ============================================================ */

export function CardTopFilet() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)]"
    />
  )
}

export function SectionHead({
  title,
  meta,
  color = '#ca8a04',
}: {
  title: React.ReactNode
  meta?: React.ReactNode
  color?: string
}) {
  return (
    <div className="mb-[18px] flex items-center gap-3">
      <span
        className="inline-block h-[6px] w-[6px] rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${color}99` }}
      />
      <h3 className="m-0 font-heading text-[20px] font-normal italic leading-[1.2] text-blanc">{title}</h3>
      {meta && <span className="ml-1 text-[12px] text-blanc-muted/55">{meta}</span>}
    </div>
  )
}
