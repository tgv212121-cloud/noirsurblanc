'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Check, ArrowRight } from './icons'
import type { Question } from './questions'

type Answers = Record<number, string | Record<number, string>>

type Props = {
  answers: Answers
  questions: Question[]
  portalUrl?: string | null
}

export default function CompletionScreen({ answers, questions, portalUrl }: Props) {
  const answeredCount = Object.keys(answers).filter(key => {
    const val = answers[Number(key)]
    if (typeof val === 'object') {
      return Object.values(val).some(v => v && v.trim() !== '')
    }
    return typeof val === 'string' && val.trim() !== ''
  }).length

  return (
    <div className="min-h-screen bg-noir flex flex-col items-center justify-center px-6 relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/[0.03] blur-[180px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative z-10 text-center max-w-lg"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6, type: "spring", stiffness: 150, damping: 15 }}
          className="relative w-20 h-20 mx-auto mb-10"
        >
          <div className="absolute inset-0 rounded-full bg-gold/10 blur-xl" />
          <div className="relative w-full h-full rounded-full border border-gold/20 flex items-center justify-center bg-gold-muted">
            <Check className="text-gold" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="font-heading text-5xl md:text-6xl font-medium text-blanc mb-4 italic"
        >
          Merci
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="text-blanc-muted text-base mb-3 leading-relaxed font-light"
        >
          Ton onboarding est terminé. Tes réponses nous permettent d&apos;être alignés pour créer le meilleur contenu possible.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/[0.06] bg-white/[0.02] mt-4 mb-12"
        >
          <span className="text-gold font-semibold text-sm">{answeredCount}</span>
          <span className="text-blanc-muted/60 text-xs">questions complétées sur {questions.length}</span>
        </motion.div>

        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="w-12 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent mx-auto mb-12"
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.03] to-transparent" />
          <div className="relative rounded-2xl border border-white/[0.06] p-8">
            <p className="text-gold font-heading text-xs uppercase tracking-[0.2em] mb-3 italic">
              Ton espace est prêt
            </p>
            <p className="text-blanc text-base font-light mb-6">
              Accède à ton portail pour voir tes posts, discuter avec ton copywriter et suivre tes stats.
            </p>
            {portalUrl && (
              <Link
                href={portalUrl}
                className="group inline-flex items-center gap-3 px-8 py-3.5 cursor-pointer relative"
              >
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
                <span className="relative z-10 text-noir font-semibold text-sm tracking-wide">
                  Accéder à mon portail
                </span>
                <ArrowRight className="relative z-10 text-noir group-hover:translate-x-1 transition-transform duration-300" width={16} height={16} />
              </Link>
            )}
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="mt-16 font-heading text-xl font-medium tracking-tight text-white/[0.08]"
        >
          Noir<span className="italic">sur</span>blanc
        </motion.p>
      </motion.div>
    </div>
  )
}
