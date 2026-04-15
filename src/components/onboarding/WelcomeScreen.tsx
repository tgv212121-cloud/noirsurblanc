'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from './icons'

export default function WelcomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="min-h-screen flex flex-col items-center justify-center px-6 relative z-10"
    >
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-b from-transparent via-gold/40 to-transparent origin-top"
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-4"
      >
        <h1 className="text-6xl md:text-8xl font-heading font-bold tracking-tight text-blanc">
          Noir<span className="text-gold italic">sur</span>blanc
        </h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-blanc-muted text-base md:text-lg font-light tracking-[0.2em] uppercase mb-12"
      >
        Le contenu qui travaille pour toi
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-md w-full mb-10"
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent" />
        <div className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm px-8 py-10 text-center">
          <h2 className="font-heading text-2xl md:text-3xl font-medium text-blanc mb-4 italic">
            Bienvenue dans ton onboarding
          </h2>
          <p className="text-blanc-muted text-sm leading-relaxed max-w-sm mx-auto">
            Quelques questions pour mieux te connaître et créer du contenu LinkedIn
            parfaitement adapté à toi et à ta cible.
          </p>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="group relative flex items-center gap-3 px-10 py-4 cursor-pointer"
      >
        <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
        <span className="relative z-10 text-noir font-semibold text-base tracking-wide">
          Commencer
        </span>
        <ArrowRight className="relative z-10 text-noir group-hover:translate-x-1 transition-transform duration-300" />
      </motion.button>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        className="mt-8 text-blanc-muted/30 text-xs tracking-widest uppercase"
      >
        Environ 10 minutes
      </motion.p>

      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: 0.2, duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-24 bg-gradient-to-t from-transparent via-gold/20 to-transparent origin-bottom"
      />
    </motion.div>
  )
}
