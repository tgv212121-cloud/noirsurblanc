'use client'

import { useState } from 'react'
import { clients } from '@/data/clients'
import { reminders } from '@/data/reminders'
import { formatRelative, DAYS_FR, cn } from '@/lib/utils'
import GooeyNav from '@/components/ui/GooeyNavComponent'
import PulseButton from '@/components/ui/PulseButton'
import { motion } from 'framer-motion'
import WordReveal from '@/components/animations/WordReveal'
import Counter from '@/components/animations/Counter'
import { ClipReveal } from '@/components/animations/RevealSection'
import type { ReminderStatus } from '@/types'

const STATUS_FILTERS: { value: ReminderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'responded', label: 'Répondus' },
  { value: 'sent', label: 'En attente' },
  { value: 'scheduled', label: 'Programmés' },
]

export default function RemindersPage() {
  const [filter, setFilter] = useState<ReminderStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly'>('weekly')
  const [day, setDay] = useState(1)
  const [time, setTime] = useState('09:00')
  const [message, setMessage] = useState('')

  const filtered = reminders
    .filter(r => filter === 'all' || r.status === filter)
    .map(r => ({ ...r, client: clients.find(c => c.id === r.clientId) }))
    .sort((a, b) => {
      const order: Record<string, number> = { sent: 0, scheduled: 1, responded: 2 }
      return (order[a.status] ?? 3) - (order[b.status] ?? 3)
    })

  const respondedCount = reminders.filter(r => r.status === 'responded').length
  const sentCount = reminders.filter(r => r.status === 'sent').length
  const scheduledCount = reminders.filter(r => r.status === 'scheduled').length

  const generateWhatsAppLink = (phone: string, msg: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '')
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`
  }

  return (
    <div className="py-12">
      <header className="mb-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-blanc-muted text-xs tracking-[0.2em] uppercase font-body mb-3"
        >
          Rappels
        </motion.p>
        <div className="overflow-hidden">
          <WordReveal className="font-heading text-5xl font-bold tracking-[-0.04em] leading-[0.9] text-blanc" delay={0.2}>
            Contexte
          </WordReveal>
        </div>
        <div className="overflow-hidden">
          <WordReveal className="font-heading text-4xl font-bold tracking-[-0.04em] leading-[0.9] text-gold italic" delay={0.35}>
            hebdomadaire
          </WordReveal>
        </div>
      </header>

      <ClipReveal delay={0.5} direction="left">
        <section className="grid grid-cols-3 gap-8 mb-12 border-t border-b border-blanc/[0.06] py-8">
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Répondus</p>
            <Counter target={respondedCount} className="font-heading text-2xl font-bold text-emerald-600" delay={600} />
          </div>
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">En attente</p>
            <Counter target={sentCount} className="font-heading text-2xl font-bold text-gold" delay={700} />
          </div>
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Programmés</p>
            <Counter target={scheduledCount} className="font-heading text-2xl font-bold text-blanc-muted" delay={800} />
          </div>
        </section>
      </ClipReveal>

      <div className="flex items-center justify-between mb-10">
        <GooeyNav
          items={STATUS_FILTERS.map(s => ({ label: s.label }))}
          initialActiveIndex={0}
          particleCount={18}
          particleDistances={[70, 10]}
          particleR={80}
          animationTime={500}
          timeVariance={400}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          onActiveChange={(index) => setFilter(STATUS_FILTERS[index].value)}
        />
        <PulseButton onClick={() => setShowForm(!showForm)}>
          + Rappel
        </PulseButton>
      </div>

      {showForm && (
        <div className="mb-10 border border-blanc/[0.08] bg-noir-card p-8">
          <p className="text-xs text-blanc-muted uppercase tracking-[0.15em] mb-6">Nouveau rappel</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] block mb-2">Client</label>
              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className="w-full bg-noir border border-blanc/[0.08] px-3 py-2.5 text-sm text-blanc focus:border-gold/40 transition-all duration-300 outline-none"
              >
                <option value="">Sélectionner...</option>
                {clients.filter(c => c.status === 'active').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] block mb-2">Fréquence</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFrequency('weekly')}
                  className={cn('flex-1 py-2.5 text-xs border transition-colors duration-300 cursor-pointer',
                    frequency === 'weekly' ? 'border-gold/40 text-gold bg-gold-muted' : 'border-blanc/[0.08] text-blanc-muted'
                  )}
                >
                  Hebdo
                </button>
                <button
                  onClick={() => setFrequency('biweekly')}
                  className={cn('flex-1 py-2.5 text-xs border transition-colors duration-300 cursor-pointer',
                    frequency === 'biweekly' ? 'border-gold/40 text-gold bg-gold-muted' : 'border-blanc/[0.08] text-blanc-muted'
                  )}
                >
                  Bi-hebdo
                </button>
              </div>
            </div>
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] block mb-2">Jour</label>
              <select
                value={day}
                onChange={e => setDay(Number(e.target.value))}
                className="w-full bg-noir border border-blanc/[0.08] px-3 py-2.5 text-sm text-blanc focus:border-gold/40 transition-all duration-300 outline-none"
              >
                {DAYS_FR.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] block mb-2">Heure</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-noir border border-blanc/[0.08] px-3 py-2.5 text-sm text-blanc focus:border-gold/40 transition-all duration-300 outline-none"
              />
            </div>
          </div>
          <div className="mb-5">
            <label className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] block mb-2">Message WhatsApp</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Salut [prénom], c'est l'heure du debrief hebdo..."
              rows={3}
              className="w-full bg-noir border border-blanc/[0.08] px-4 py-3 text-sm text-blanc font-body placeholder:text-blanc-muted/50 focus:border-gold/40 transition-all duration-300 resize-none outline-none"
            />
          </div>
          <div className="flex gap-3">
            <PulseButton>Créer le rappel</PulseButton>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-xs text-blanc-muted cursor-pointer">Annuler</button>
          </div>
        </div>
      )}

      <div className="border-t border-blanc/[0.06]">
        {filtered.map(r => (
          <div key={r.id} className="py-6 border-b border-blanc/[0.04] grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-5 items-start">
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-2 h-2 rounded-full mt-1.5 shrink-0',
                r.status === 'responded' ? 'bg-emerald-500' :
                r.status === 'sent' ? 'bg-gold' :
                'bg-blanc-muted/30'
              )} />
              <div>
                <p className="text-sm text-blanc/80 font-medium">{r.client?.name}</p>
                <p className="text-xs text-blanc-muted mt-0.5">
                  {r.frequency === 'weekly' ? 'Hebdo' : 'Bi-hebdo'} — {DAYS_FR[r.dayOfWeek]} {r.time}
                </p>
                {r.lastSentAt && (
                  <p className="text-[10px] text-blanc-muted mt-0.5">
                    Envoyé {formatRelative(r.lastSentAt)}
                    {r.lastResponseAt && ` — Réponse ${formatRelative(r.lastResponseAt)}`}
                  </p>
                )}
              </div>
            </div>

            <div>
              {r.response ? (
                <div className="border-l-[2px] border-emerald-500/30 pl-4">
                  <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1">Réponse</p>
                  <p className="text-xs text-blanc/60 font-light line-clamp-3">{r.response}</p>
                </div>
              ) : (
                <p className="text-xs text-blanc-muted font-light line-clamp-2 italic">{r.message}</p>
              )}
            </div>

            <div className="flex gap-2">
              {r.client && r.status !== 'responded' && (
                <a
                  href={generateWhatsAppLink(r.client.phone, r.message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-[10px] text-emerald-600 border border-emerald-500/20 hover:bg-emerald-50 transition-colors duration-300 uppercase tracking-wider"
                >
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
