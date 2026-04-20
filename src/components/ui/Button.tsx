'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'danger' | 'icon'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  fullWidth?: boolean
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'nsb-btn nsb-btn-primary',
  secondary: 'nsb-btn nsb-btn-secondary',
  danger: 'nsb-btn nsb-btn-danger',
  icon: 'nsb-btn-icon',
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', fullWidth, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(VARIANT_CLASS[variant], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  )
})

export default Button
