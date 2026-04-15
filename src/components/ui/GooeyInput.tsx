// <!-- Integrated via Catalogue by Thomas Gildas (digitaltimes.fr) -->
// Source : https://ui.aceternity.com/components/gooey-input
// Library : aceternity

'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'

type GooeyInputProps = {
  placeholder?: string
  className?: string
  collapsedWidth?: number
  expandedWidth?: number
  expandedOffset?: number
  gooeyBlur?: number
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  disabled?: boolean
  buttonLabel?: string
}

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="18"
    height="18"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="18"
    height="18"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)

export const GooeyInput = React.forwardRef<HTMLDivElement, GooeyInputProps>(
  (
    {
      placeholder = 'Type to search...',
      className,
      collapsedWidth = 115,
      expandedWidth = 200,
      expandedOffset = 50,
      gooeyBlur = 5,
      value: controlledValue,
      defaultValue = '',
      onValueChange,
      onOpenChange,
      disabled = false,
      buttonLabel = 'Search',
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [internalValue, setInternalValue] = React.useState(defaultValue)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const value = controlledValue !== undefined ? controlledValue : internalValue
    const filterId = React.useId()

    const handleOpen = () => {
      if (disabled) return
      setIsOpen(true)
      onOpenChange?.(true)
      setTimeout(() => inputRef.current?.focus(), 50)
    }

    const handleClose = () => {
      setIsOpen(false)
      onOpenChange?.(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onValueChange?.(newValue)
    }

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex items-center', className)}
        style={{ filter: `url(#${filterId.replace(/:/g, '')})` }}
      >
        {/* SVG Gooey filter */}
        <svg className="absolute h-0 w-0">
          <defs>
            <filter id={filterId.replace(/:/g, '')}>
              <feGaussianBlur in="SourceGraphic" stdDeviation={gooeyBlur} result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                result="goo"
              />
              <feComposite in="SourceGraphic" in2="goo" operator="atop" />
            </filter>
          </defs>
        </svg>

        <AnimatePresence mode="wait" initial={false}>
          {!isOpen ? (
            <motion.button
              key="collapsed"
              layoutId="gooey-input-shape"
              onClick={handleOpen}
              disabled={disabled}
              className="relative flex items-center justify-center gap-2 rounded-full bg-blue-600 text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ width: collapsedWidth, height: 44, padding: '0 18px' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              whileTap={{ scale: 0.96 }}
            >
              <SearchIcon />
              <span>{buttonLabel}</span>
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              layoutId="gooey-input-shape"
              className="relative flex items-center bg-blue-600 rounded-full overflow-hidden"
              style={{ width: expandedWidth, height: 44, marginLeft: expandedOffset }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white pointer-events-none">
                <SearchIcon />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full h-full bg-transparent outline-none text-white placeholder-white/60 text-sm"
                style={{ paddingLeft: 38, paddingRight: 38 }}
              />
              <button
                onClick={handleClose}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white cursor-pointer p-1"
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }
)

GooeyInput.displayName = 'GooeyInput'
