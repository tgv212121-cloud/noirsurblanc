'use client'

import { motion } from 'framer-motion'

export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = ((current + 1) / total) * 100

  return (
    <div className="px-8 md:px-16">
      <div className="relative w-full h-px bg-blanc/[0.08]">
        <motion.div
          className="absolute top-0 left-0 h-full bg-gold"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold shadow-[0_0_12px_rgba(202,138,4,0.6)]"
          animate={{ left: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ marginLeft: '-4px' }}
        />
      </div>
    </div>
  )
}
