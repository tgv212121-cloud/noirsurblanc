'use client'

import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { questionIcons } from './icons'
import type { Question } from './questions'

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
    filter: 'blur(4px)',
  }),
}

type Props = {
  question: Question
  answer: string | Record<number, string> | undefined
  onAnswer: (questionId: number, value: string | Record<number, string>) => void
  direction: number
}

export default function QuestionCard({ question, answer, onAnswer, direction }: Props) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const Icon = questionIcons[question.id - 1]

  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) inputRef.current.focus()
    }, 500)
    return () => clearTimeout(timer)
  }, [question.id])

  const handleChange = (value: string, fieldIndex?: number) => {
    if ((question.type === 'multi-input' || question.type === 'triple-input') && fieldIndex !== undefined) {
      const currentAnswer = (answer as Record<number, string>) || {}
      onAnswer(question.id, { ...currentAnswer, [fieldIndex]: value })
    } else {
      onAnswer(question.id, value)
    }
  }

  const inputClasses = "w-full bg-noir-card border border-blanc/[0.08] px-6 py-5 text-blanc text-[15px] font-body placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-noir-elevated transition-all duration-500 hover:border-gold/30 outline-none"
  const smallInputClasses = "flex-1 bg-noir-card border border-blanc/[0.08] px-5 py-4 text-blanc text-sm font-body placeholder:text-blanc-muted/25 focus:border-gold/30 focus:bg-noir-elevated transition-all duration-500 hover:border-gold/30 outline-none"

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="inline-flex items-center gap-2.5 mb-6"
        >
          {Icon && (
            <div className="flex items-center justify-center w-8 h-8 bg-gold-muted text-gold">
              <Icon width={16} height={16} />
            </div>
          )}
          <span className="text-blanc-muted text-xs font-medium tracking-[0.15em] uppercase">
            Question {question.id}
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="font-heading text-3xl md:text-4xl font-medium text-blanc leading-tight italic"
        >
          {question.question}
        </motion.h2>

        {question.subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="text-blanc-muted/50 text-sm mt-3 font-light"
          >
            {question.subtitle}
          </motion.p>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        {question.type === 'textarea' && (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={(answer as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            rows={question.large ? 5 : 3}
            className={inputClasses + ' resize-none'}
          />
        )}

        {question.type === 'text' && (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={(answer as string) || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.placeholder}
            className={inputClasses}
          />
        )}

        {question.type === 'multi-input' && question.fields && (
          <div className="space-y-3">
            {question.fields.map((field, index) => (
              <div key={index} className="flex items-center gap-4">
                <span className="text-gold/80 font-heading text-sm w-16 shrink-0 text-right italic">
                  {field.label}
                </span>
                <div className="w-px h-8 bg-blanc/[0.06]" />
                <input
                  ref={index === 0 ? inputRef as React.RefObject<HTMLInputElement> : null}
                  type="text"
                  value={((answer as Record<number, string>)?.[index]) || ''}
                  onChange={(e) => handleChange(e.target.value, index)}
                  placeholder={field.placeholder}
                  className={smallInputClasses}
                />
              </div>
            ))}
          </div>
        )}

        {question.type === 'triple-input' && question.fields && (
          <div className="space-y-3">
            {question.fields.map((field, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex items-center justify-center w-8 h-8 border border-gold/20 text-gold font-heading text-sm shrink-0">
                  {index + 1}
                </div>
                <input
                  ref={index === 0 ? inputRef as React.RefObject<HTMLInputElement> : null}
                  type="text"
                  value={((answer as Record<number, string>)?.[index]) || ''}
                  onChange={(e) => handleChange(e.target.value, index)}
                  placeholder={field.placeholder}
                  className={smallInputClasses}
                />
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
