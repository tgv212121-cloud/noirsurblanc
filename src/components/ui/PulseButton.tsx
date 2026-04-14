'use client'

import { cn } from '@/lib/utils'

type Props = {
  children: React.ReactNode
  onClick?: (e: React.MouseEvent) => void
  className?: string
  type?: 'button' | 'submit'
}

export default function PulseButton({ children, onClick, className, type = 'button' }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        'group relative inline-flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-300',
        'text-blanc bg-noir-card rounded-xl',
        'border border-border hover:border-gold/30',
        'shadow-[0_0_0_0_rgba(37,99,235,0.4)]',
        'hover:shadow-[0_0_20px_4px_rgba(37,99,235,0.15)]',
        'active:scale-[0.98]',
        className
      )}
      style={{
        animation: 'pulse-glow 2.5s ease-in-out infinite',
        padding: '16px 40px',
      }}
    >
      {/* Glow background */}
      <span className="absolute inset-0 rounded-xl bg-gold/[0.03] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Text */}
      <span className="relative z-10">{children}</span>
    </button>
  )
}
