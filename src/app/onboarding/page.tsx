'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import QuestionCard from '@/components/onboarding/QuestionCard'
import ProgressBar from '@/components/onboarding/ProgressBar'
import CompletionScreen from '@/components/onboarding/CompletionScreen'
import { ChevronLeft, ChevronRight, ArrowRight } from '@/components/onboarding/icons'
import { questions } from '@/components/onboarding/questions'
import { createClient, fetchClient, saveOnboardingAnswer } from '@/lib/queries'
import type { Client } from '@/types'

type Answers = Record<number, string | Record<number, string>>

function OnboardingInner() {
  const searchParams = useSearchParams()
  const clientIdParam = searchParams.get('client')

  const [client, setClient] = useState<Client | null>(null)
  const [needsIdentity, setNeedsIdentity] = useState(!clientIdParam)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '' })
  const [creating, setCreating] = useState(false)

  const [started, setStarted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [completed, setCompleted] = useState(false)
  const [direction, setDirection] = useState(1)

  // Load client from URL if provided
  useEffect(() => {
    if (clientIdParam) {
      fetchClient(clientIdParam).then(c => {
        if (c) {
          setClient(c)
          setNeedsIdentity(false)
        } else {
          setNeedsIdentity(true)
        }
      })
    }
  }, [clientIdParam])

  const handleCreateIdentity = useCallback(async () => {
    if (!form.name.trim() || !form.company.trim() || !form.email.trim()) return
    setCreating(true)
    const c = await createClient({
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
    })
    setCreating(false)
    if (c) {
      setClient(c)
      setNeedsIdentity(false)
    } else {
      alert("Erreur lors de la création du compte. Réessaye.")
    }
  }, [form])

  const handleStart = useCallback(() => { setStarted(true) }, [])

  const handleAnswer = useCallback((questionId: number, value: string | Record<number, string>) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
    if (client) saveOnboardingAnswer(client.id, questionId, value)
  }, [client])

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
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleNext()
  }, [handleNext])

  if (completed) {
    return (
      <CompletionScreen
        answers={answers}
        questions={questions}
        portalUrl={client ? `/portal/${client.id}` : null}
      />
    )
  }

  // Identity form (only if no ?client= param)
  if (needsIdentity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 relative onboarding-noise">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-gold/[0.02] blur-[180px]" />
          <div className="absolute bottom-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gold/[0.015] blur-[200px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0a_70%)]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center mb-10"
        >
          <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tight text-blanc mb-3">
            Noir<span className="text-gold italic">sur</span>blanc
          </h1>
          <p className="text-blanc-muted text-sm font-light tracking-[0.2em] uppercase">Création de ton compte</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 w-full max-w-md"
        >
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/[0.04] to-transparent" />
          <div className="relative rounded-3xl border border-white/[0.06] backdrop-blur-sm px-8 py-10 space-y-5">
            {(['name', 'company', 'email', 'phone'] as const).map((field) => {
              const labels = { name: 'Nom complet', company: 'Entreprise', email: 'Email', phone: 'Téléphone (optionnel)' }
              const placeholders = { name: 'Léa Fournier', company: 'Fournier Group', email: 'lea@fourniergroup.fr', phone: '+33 6 45 67 89 02' }
              const types = { name: 'text', company: 'text', email: 'email', phone: 'tel' }
              return (
                <div key={field}>
                  <label className="text-[10px] text-blanc-muted/40 uppercase tracking-[0.15em] block mb-2">{labels[field]}</label>
                  <input
                    type={types[field]}
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholders[field]}
                    className="w-full bg-white/[0.02] border border-white/[0.07] rounded-xl px-5 py-3.5 text-blanc text-sm placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-white/[0.04] transition-all duration-500 hover:border-white/[0.12] outline-none"
                  />
                </div>
              )
            })}

            <button
              onClick={handleCreateIdentity}
              disabled={creating || !form.name.trim() || !form.company.trim() || !form.email.trim()}
              className="group relative flex items-center justify-center gap-3 w-full px-10 py-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              <div className="absolute inset-0 rounded-2xl bg-gold/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
              <span className="relative z-10 text-noir font-semibold text-base tracking-wide">
                {creating ? 'Création...' : 'Continuer'}
              </span>
              <ArrowRight className="relative z-10 text-noir group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-noir flex flex-col onboarding-noise" onKeyDown={handleKeyDown}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full bg-gold/[0.02] blur-[180px]" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[700px] h-[700px] rounded-full bg-gold/[0.015] blur-[200px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0a_70%)]" />
      </div>

      <AnimatePresence mode="wait">
        {!started ? (
          <WelcomeScreen key="welcome" onStart={handleStart} />
        ) : (
          <div key="form" className="relative z-10 flex flex-col min-h-screen">
            <header className="flex items-center justify-between px-8 md:px-16 py-8">
              <span className="font-heading text-xl md:text-2xl font-medium tracking-tight text-blanc">
                Noir<span className="text-gold italic">sur</span>blanc
              </span>
              <span className="text-blanc-muted/40 text-xs tracking-[0.15em] uppercase font-light">
                {String(currentStep + 1).padStart(2, '0')} / {String(questions.length).padStart(2, '0')}
              </span>
            </header>

            <ProgressBar current={currentStep} total={questions.length} />

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

            <nav className="flex flex-col items-center gap-5 px-8 md:px-16 py-8">
              <button
                onClick={handleNext}
                className="group relative flex items-center gap-2.5 px-10 py-3.5 cursor-pointer"
              >
                <div className="absolute inset-0 rounded-2xl bg-gold/15 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30 group-active:scale-[0.98] transition-transform duration-200" />
                <span className="relative z-10 text-noir font-semibold text-sm tracking-wide">
                  {currentStep === questions.length - 1 ? 'Terminer' : 'Continuer'}
                </span>
                <ChevronRight className="relative z-10 text-noir group-hover:translate-x-0.5 transition-transform duration-300" width={16} height={16} />
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
                <kbd className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] text-blanc-muted/30 font-body">Ctrl</kbd>
                {' + '}
                <kbd className="px-1.5 py-0.5 rounded border border-white/[0.06] bg-white/[0.02] text-blanc-muted/30 font-body">Enter</kbd>
              </span>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-noir" />}>
      <OnboardingInner />
    </Suspense>
  )
}
