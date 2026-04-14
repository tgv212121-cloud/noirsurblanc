'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QuestionCard from '@/components/onboarding/QuestionCard'
import ProgressBar from '@/components/onboarding/ProgressBar'
import { questions } from '@/components/onboarding/questions'
import { ChevronLeft, ChevronRight, ArrowRight, Check } from '@/components/onboarding/icons'
import { clients } from '@/data/clients'

type Answers = Record<number, string | Record<number, string>>

export default function OnboardingPage() {
  const [selectedClient, setSelectedClient] = useState('')
  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [completed, setCompleted] = useState(false)
  const [direction, setDirection] = useState(1)

  const handleStart = useCallback(() => {
    if (!selectedClient) return
    setStarted(true)
  }, [selectedClient])

  const handleAnswer = useCallback((questionId: number, value: string | Record<number, string>) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentStep < questions.length - 1) {
      setDirection(1)
      setCurrentStep(prev => prev + 1)
    } else {
      setCompleted(true)
    }
  }, [currentStep])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleNext()
    }
  }, [handleNext])

  // Completion screen
  if (completed) {
    const answeredCount = Object.keys(answers).filter(key => {
      const val = answers[Number(key)]
      if (typeof val === 'object') {
        return Object.values(val).some(v => v && v.trim() !== '')
      }
      return typeof val === 'string' && val.trim() !== ''
    }).length

    const clientName = clients.find(c => c.id === selectedClient)?.name || ''

    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
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
            L&apos;onboarding de {clientName} est complet. Les réponses sont enregistrées.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-blanc/[0.08] bg-white/[0.02] mt-4 mb-12"
          >
            <span className="text-gold font-semibold text-sm">{answeredCount}</span>
            <span className="text-blanc-muted/60 text-xs">questions sur {questions.length}</span>
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
          >
            <button
              onClick={() => {
                setCompleted(false)
                setStarted(false)
                setCurrentStep(0)
                setAnswers({})
                setSelectedClient('')
              }}
              className="px-6 py-3 text-sm text-gold border-2 border-gold font-medium rounded-xl hover:bg-gold-muted transition-colors duration-200 cursor-pointer"
            >
              Nouvel onboarding
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Welcome / client selector
  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-gold/[0.02] blur-[180px]" />
          <div className="absolute bottom-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gold/[0.015] blur-[200px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--noir)_70%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center"
        >
          <h1 className="text-6xl md:text-8xl font-heading font-bold tracking-tight text-blanc mb-4">
            Noir<span className="text-gold italic">sur</span>blanc
          </h1>
          <p className="text-blanc-muted text-base md:text-lg font-light tracking-[0.2em] uppercase mb-12">
            Onboarding client
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="border border-blanc/[0.08] px-8 py-10">
            <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-3">
              Client à onboarder
            </label>
            <select
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
              className="w-full bg-noir-card border border-blanc/[0.08] px-4 py-3 text-sm text-blanc focus:border-gold/30 transition-all duration-300 mb-6 outline-none"
            >
              <option value="" className="bg-noir text-blanc-muted">Sélectionner un client...</option>
              {clients.filter(c => c.status === 'onboarding' || c.status === 'active').map(c => (
                <option key={c.id} value={c.id} className="bg-noir text-blanc">{c.name} — {c.company}</option>
              ))}
            </select>

            <button
              onClick={handleStart}
              disabled={!selectedClient}
              className="group relative flex items-center justify-center gap-3 w-full px-10 py-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gold border border-gold" />
              <span className="relative z-10 text-white font-semibold text-base tracking-wide">
                Commencer
              </span>
              <ArrowRight className="relative z-10 text-white group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            <p className="mt-6 text-blanc-muted/20 text-xs tracking-widest uppercase text-center">
              17 questions — environ 10 minutes
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  // Form
  return (
    <div className="min-h-screen flex flex-col" onKeyDown={handleKeyDown}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-gold/[0.02] blur-[180px]" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gold/[0.015] blur-[200px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--noir)_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-8 md:px-16 py-8">
          <span className="font-heading text-xl md:text-2xl font-medium tracking-tight text-blanc">
            Noir<span className="text-gold italic">sur</span>blanc
          </span>
          <span className="text-blanc-muted/40 text-xs tracking-[0.15em] uppercase font-light">
            {String(currentStep + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
          </span>
        </header>

        <ProgressBar current={currentStep} total={questions.length} />

        {/* Question */}
        <main className="flex-1 flex items-center justify-center px-6 md:px-12 py-8">
          <div className="w-full max-w-2xl">
            <AnimatePresence mode="wait" custom={direction}>
              <QuestionCard
                key={questions[currentStep].id}
                question={questions[currentStep]}
                answer={answers[questions[currentStep].id]}
                onAnswer={handleAnswer}
                direction={direction}
              />
            </AnimatePresence>
          </div>
        </main>

        {/* Navigation */}
        <nav className="flex flex-col items-center gap-5 px-8 md:px-16 py-8">
          <button
            onClick={handleNext}
            className="group relative flex items-center gap-2.5 px-10 py-3.5 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gold/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-gold border border-gold group-active:scale-[0.98] transition-transform duration-200" />
            <span className="relative z-10 text-white font-semibold text-sm tracking-wide">
              {currentStep === questions.length - 1 ? 'Terminer' : 'Continuer'}
            </span>
            <ChevronRight className="relative z-10 text-white group-hover:translate-x-0.5 transition-transform duration-300" width={16} height={16} />
          </button>

          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1.5 text-blanc-muted/30 hover:text-blanc-muted/60 transition-colors duration-300 disabled:opacity-0 disabled:pointer-events-none text-xs cursor-pointer"
          >
            <ChevronLeft width={14} height={14} />
            <span>Précédent</span>
          </button>
        </nav>

        <div className="text-center pb-5">
          <span className="text-blanc-muted/20 text-[10px] tracking-widest uppercase">
            <kbd className="px-1.5 py-0.5 border border-blanc/[0.08] bg-white/[0.02] text-blanc-muted/30 font-body">Ctrl</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 border border-blanc/[0.08] bg-white/[0.02] text-blanc-muted/30 font-body">Enter</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
