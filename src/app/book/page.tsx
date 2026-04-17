'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchAvailabilityRules, fetchAppointments, createAppointment } from '@/lib/queries'
import type { AvailabilityRule, Appointment } from '@/types'

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function pad(n: number) { return n.toString().padStart(2, '0') }
function dateKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function buildSlots(rules: AvailabilityRule[], appointments: Appointment[], daysAhead: number) {
  const now = new Date()
  const taken = new Set(appointments.map(a => a.scheduledAt))
  const out: { date: Date; iso: string }[] = []
  for (let d = 0; d < daysAhead; d++) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
    const dow = base.getDay()
    const ruleForDay = rules.filter(r => r.enabled && r.dayOfWeek === dow)
    for (const rule of ruleForDay) {
      const [sh, sm] = rule.startTime.split(':').map(Number)
      const [eh, em] = rule.endTime.split(':').map(Number)
      for (let t = sh * 60 + sm; t + rule.slotDurationMin <= eh * 60 + em; t += rule.slotDurationMin) {
        const slot = new Date(base)
        slot.setHours(Math.floor(t / 60), t % 60, 0, 0)
        if (slot <= now) continue
        const iso = slot.toISOString()
        if (taken.has(iso)) continue
        out.push({ date: slot, iso })
      }
    }
  }
  return out
}

export default function BookPublicPage() {
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; iso: string } | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [topic, setTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<{ date: Date; meetingUrl: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const [r, a] = await Promise.all([
        fetchAvailabilityRules(),
        fetchAppointments({ fromIso: new Date().toISOString() }),
      ])
      setRules(r); setAppointments(a); setLoading(false)
    })()
  }, [])

  const slots = useMemo(() => buildSlots(rules, appointments, 21), [rules, appointments])
  const slotsByDay = useMemo(() => {
    const map: Record<string, { date: Date; iso: string }[]> = {}
    for (const s of slots) {
      const k = dateKey(s.date)
      if (!map[k]) map[k] = []
      map[k].push(s)
    }
    return map
  }, [slots])

  const duration = rules.find(r => r.enabled)?.slotDurationMin || 30

  const handleConfirm = async () => {
    if (!selectedSlot) return
    setErr(null)
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    if (!firstName.trim() || !lastName.trim()) { setErr('Renseigne ton prénom et ton nom.'); return }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { setErr('Email invalide.'); return }
    setSubmitting(true)
    const apt = await createAppointment({
      scheduledAt: selectedSlot.iso,
      durationMin: duration,
      topic: topic.trim() || undefined,
      prospectName: fullName,
      prospectEmail: email.trim(),
      prospectCompany: company.trim() || undefined,
    })
    setSubmitting(false)
    if (!apt) {
      setErr("Ce créneau vient d'être pris. Choisis-en un autre.")
      const refreshed = await fetchAppointments({ fromIso: new Date().toISOString() })
      setAppointments(refreshed)
      setSelectedSlot(null)
      return
    }
    // Fire confirmation email
    try {
      await fetch('/api/send-booking-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apt.id, clientName: fullName }),
      })
    } catch (e) { console.error(e) }
    setSuccess({ date: selectedSlot.date, meetingUrl: apt.meetingUrl || '' })
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px', color: '#fafaf9', fontSize: '14px', padding: '14px 16px', outline: 'none',
    transition: 'all 0.3s ease', fontFamily: 'inherit',
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.10), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[900px] h-[900px] rounded-full blur-[220px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.06), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center w-full" style={{ maxWidth: '720px', marginBottom: '56px' }}
        >
          <h1 className="font-heading font-bold tracking-tight text-blanc leading-none" style={{ fontSize: 'clamp(44px, 7vw, 68px)' }}>
            Noir<span className="text-gold italic">sur</span>blanc
          </h1>
          <p className="text-blanc-muted/60 text-[11px] tracking-[0.35em] uppercase" style={{ marginTop: '18px', marginBottom: '36px' }}>
            Réservation d&apos;un appel
          </p>
          <p className="text-blanc-muted text-base md:text-lg leading-relaxed" style={{ maxWidth: '520px', margin: '0 auto' }}>
            Choisis un créneau qui te convient. Appel de <span className="text-blanc">{duration} minutes</span> en visio.
          </p>
        </motion.div>

        {success ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="w-full text-center rounded-3xl" style={{ maxWidth: '520px', padding: '56px 36px', background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.22)' }}>
            <div className="flex items-center justify-center rounded-full mx-auto" style={{ width: '64px', height: '64px', background: 'rgba(202,138,4,0.15)', border: '1px solid rgba(202,138,4,0.3)', marginBottom: '24px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="font-heading text-blanc italic" style={{ fontSize: '36px', marginBottom: '12px' }}>
              C&apos;est confirmé
            </h2>
            <p className="text-blanc-muted text-sm leading-relaxed" style={{ marginBottom: '28px' }}>
              Ton rendez-vous est bloqué le <strong className="text-blanc">{DAYS_SHORT[success.date.getDay()]} {success.date.getDate()} {MONTHS_FR[success.date.getMonth()]}</strong> à <strong className="text-blanc">{pad(success.date.getHours())}h{pad(success.date.getMinutes())}</strong>. Un email de confirmation vient de t&apos;être envoyé.
            </p>
            {success.meetingUrl && (
              <a href={success.meetingUrl} className="group relative inline-flex items-center gap-2 cursor-pointer" style={{ padding: '14px 32px' }}>
                <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)', border: '1px solid rgba(202,138,4,0.4)' }} />
                <span className="relative z-10 text-noir font-semibold uppercase tracking-[0.12em]" style={{ fontSize: '12px' }}>Voir le rendez-vous</span>
              </a>
            )}
          </motion.div>
        ) : loading ? (
          <p className="text-sm text-blanc-muted">Chargement...</p>
        ) : slots.length === 0 ? (
          <div className="rounded-2xl text-center" style={{ maxWidth: '480px', padding: '48px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <p className="text-sm text-blanc-muted">Aucun créneau disponible pour l&apos;instant. Reviens dans quelques jours ou contacte-nous directement.</p>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }}
            className="w-full space-y-4" style={{ maxWidth: '680px' }}>
            {Object.entries(slotsByDay).map(([key, daySlots]) => {
              const date = daySlots[0].date
              return (
                <div key={key} className="rounded-2xl" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-blanc-muted/60" style={{ marginBottom: '14px' }}>
                    {DAYS_SHORT[date.getDay()]} {date.getDate()} {MONTHS_FR[date.getMonth()]}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {daySlots.map(s => (
                      <button key={s.iso} onClick={() => setSelectedSlot(s)}
                        className="text-sm cursor-pointer transition-all hover:scale-105"
                        style={{
                          padding: '10px 20px', borderRadius: '10px',
                          background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.25)',
                          color: '#ca8a04',
                        }}>
                        {pad(s.date.getHours())}h{pad(s.date.getMinutes())}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}

        <p className="text-[10px] text-blanc-muted/40 tracking-[0.25em] uppercase" style={{ marginTop: '72px' }}>
          Noirsurblanc, le contenu qui travaille pour toi
        </p>
      </div>

      {/* Confirm modal */}
      <AnimatePresence>
        {selectedSlot && !success && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
            onClick={() => { if (!submitting) setSelectedSlot(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full rounded-3xl" style={{ maxWidth: '480px', background: 'rgba(20,20,20,0.96)', border: '1px solid rgba(255,255,255,0.08)', padding: '36px 32px' }}>
              <button onClick={() => { if (!submitting) setSelectedSlot(null) }}
                className="absolute text-blanc-muted/40 hover:text-blanc cursor-pointer"
                style={{ top: '16px', right: '16px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>

              <h3 className="font-heading text-blanc italic" style={{ fontSize: '26px', marginBottom: '8px' }}>Tes coordonnées</h3>
              <p className="text-sm text-blanc-muted/80" style={{ marginBottom: '24px' }}>
                {DAYS_SHORT[selectedSlot.date.getDay()]} {selectedSlot.date.getDate()} {MONTHS_FR[selectedSlot.date.getMonth()]} à {pad(selectedSlot.date.getHours())}h{pad(selectedSlot.date.getMinutes())} &middot; {duration} min
              </p>

              <div className="grid grid-cols-2 gap-3" style={{ marginBottom: '14px' }}>
                <div>
                  <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.15em] block" style={{ marginBottom: '8px' }}>Prénom</label>
                  <input autoFocus type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Léa" style={inputStyle} />
                </div>
                <div>
                  <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.15em] block" style={{ marginBottom: '8px' }}>Nom</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Fournier" style={inputStyle} />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.15em] block" style={{ marginBottom: '8px' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="lea@exemple.com" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.15em] block" style={{ marginBottom: '8px' }}>Entreprise (optionnel)</label>
                <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Fournier Group" style={inputStyle} />
              </div>

              <div style={{ marginBottom: '6px' }}>
                <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.15em] block" style={{ marginBottom: '8px' }}>Sujet du call (optionnel)</label>
                <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex : discussion collab ou prospection" style={inputStyle} />
              </div>

              {err && (
                <p className="text-xs text-red-400/90 flex items-center gap-2" style={{ marginTop: '14px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                  {err}
                </p>
              )}

              <div className="flex items-center gap-3" style={{ marginTop: '26px' }}>
                <button onClick={() => { if (!submitting) setSelectedSlot(null) }} disabled={submitting}
                  className="flex-1 rounded-xl text-blanc text-sm font-medium hover:bg-white/[0.03] cursor-pointer disabled:opacity-40"
                  style={{ padding: '14px 20px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Retour
                </button>
                <button onClick={handleConfirm} disabled={submitting}
                  className="group relative flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  style={{ padding: '14px 20px' }}>
                  <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)', border: '1px solid rgba(202,138,4,0.4)' }} />
                  <span className="relative z-10 text-noir font-semibold uppercase tracking-[0.12em]" style={{ fontSize: '12px' }}>
                    {submitting ? 'Réservation…' : 'Confirmer'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
