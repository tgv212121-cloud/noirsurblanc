'use client'

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import WelcomeScreen from '@/components/onboarding/WelcomeScreen'
import QuestionCard from '@/components/onboarding/QuestionCard'
import ProgressBar from '@/components/onboarding/ProgressBar'
import CompletionScreen from '@/components/onboarding/CompletionScreen'
import { questions } from '@/components/onboarding/questions'
import { useToast } from '@/components/ui/Toast'

type AnswersMap = Record<number, string | Record<number, string>>

export default function OnboardingPage() {
  const router = useRouter()
  const toast = useToast()
  const [step, setStep] = useState<'welcome' | 'questions' | 'done'>('welcome')
  const [currentQ, setCurrentQ] = useState(0)
  const [direction, setDirection] = useState(1)
  const [answers, setAnswers] = useState<AnswersMap>({})

  const total = questions.length
  const q = questions[currentQ]
  const answer = q ? answers[q.id] : undefined

  const next = () => {
    if (currentQ < total - 1) { setDirection(1); setCurrentQ(c => c + 1) }
    else { setStep('done') }
  }
  const prev = () => {
    if (currentQ > 0) { setDirection(-1); setCurrentQ(c => c - 1) }
  }
  const onAnswer = (id: number, value: string | Record<number, string>) => {
    setAnswers(prev => ({ ...prev, [id]: value }))
  }

  return (
    <div className="onboarding-noise relative">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.10), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[900px] h-[900px] rounded-full blur-[220px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.06), transparent 70%)' }} />
      </div>

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <WelcomeScreen key="welcome" onStart={() => setStep('questions')} />
        )}

        {step === 'questions' && q && (
          <div key="questions" className="min-h-screen flex flex-col px-6 py-12 relative z-10">
            <div className="w-full max-w-3xl mx-auto" style={{ marginBottom: '40px' }}>
              <ProgressBar current={currentQ} total={total} />
            </div>

            <div className="flex-1 w-full max-w-3xl mx-auto flex items-center">
              <AnimatePresence mode="wait" custom={direction}>
                <QuestionCard
                  key={q.id}
                  question={q}
                  answer={answer}
                  onAnswer={onAnswer}
                  direction={direction}
                />
              </AnimatePresence>
            </div>

            <div className="w-full max-w-3xl mx-auto flex items-center justify-between" style={{ marginTop: '40px' }}>
              <button
                onClick={prev}
                disabled={currentQ === 0}
                className="nsb-btn nsb-btn-secondary"
                style={{ padding: '12px 22px', fontSize: '12px' }}
              >
                Précédent
              </button>
              <button
                onClick={() => {
                  if (!answer) { toast.warning('Réponse requise pour continuer.'); return }
                  next()
                }}
                className="nsb-btn nsb-btn-primary"
                style={{ padding: '12px 28px', fontSize: '12px' }}
              >
                {currentQ === total - 1 ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <CompletionScreen key="done" answers={answers} questions={questions} portalUrl="/demo" />
        )}
      </AnimatePresence>
    </div>
  )
}
