'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  fetchAvailabilityRules,
  fetchAppointments,
  createAppointment,
  cancelAppointment,
} from '@/lib/queries'
import type { AvailabilityRule, Appointment } from '@/types'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'

type Props = { clientId: string; clientName: string }

const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function pad(n: number) { return n.toString().padStart(2, '0') }
function dateKey(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// Build all available slots for the next 21 days based on rules + existing bookings
function buildSlots(rules: AvailabilityRule[], appointments: Appointment[], busy: { start: string; end: string }[], daysAhead: number): { date: Date; iso: string }[] {
  const now = new Date()
  const takenIsos = new Set(appointments.map(a => a.scheduledAt))
  const busyMs = busy.map(b => [new Date(b.start).getTime(), new Date(b.end).getTime()] as const)
  const out: { date: Date; iso: string }[] = []

  for (let d = 0; d < daysAhead; d++) {
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d)
    const dow = base.getDay()
    const rulesForDay = rules.filter(r => r.enabled && r.dayOfWeek === dow)

    for (const rule of rulesForDay) {
      const [sh, sm] = rule.startTime.split(':').map(Number)
      const [eh, em] = rule.endTime.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = eh * 60 + em
      for (let t = startMin; t + rule.slotDurationMin <= endMin; t += rule.slotDurationMin) {
        const slotDate = new Date(base)
        slotDate.setHours(Math.floor(t / 60), t % 60, 0, 0)
        if (slotDate <= now) continue
        const iso = slotDate.toISOString()
        if (takenIsos.has(iso)) continue
        const slotStart = slotDate.getTime()
        const slotEnd = slotStart + rule.slotDurationMin * 60_000
        if (busyMs.some(([bs, be]) => slotStart < be && slotEnd > bs)) continue
        out.push({ date: slotDate, iso })
      }
    }
  }
  return out
}

export default function BookingTab({ clientId, clientName }: Props) {
  const [rules, setRules] = useState<AvailabilityRule[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([])
  const [busy, setBusy] = useState<{ start: string; end: string }[]>([])
  const [googleConnected, setGoogleConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; iso: string } | null>(null)
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [toCancel, setToCancel] = useState<Appointment | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const toast = useToast()

  useEffect(() => { load() }, [clientId])

  const load = async () => {
    setLoading(true)
    const nowIso = new Date().toISOString()
    const in21 = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString()
    const [r, all, mine] = await Promise.all([
      fetchAvailabilityRules(),
      fetchAppointments({ fromIso: nowIso }),
      fetchAppointments({ clientId, fromIso: nowIso }),
    ])
    setRules(r); setAppointments(all); setMyAppointments(mine); setLoading(false)
    try {
      // 1. Busy admin (la agence) - public endpoint
      const br = await fetch('/api/google/freebusy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeMin: nowIso, timeMax: in21 }),
      })
      const bd = await br.json()
      const adminBusy: { start: string; end: string }[] = bd.busy || []

      // 2. Busy client (moi) - authenticated endpoint
      let myBusy: { start: string; end: string }[] = []
      let isConnected = false
      const { data: sess } = await supabase.auth.getSession()
      const token = sess.session?.access_token
      if (token) {
        const sr = await fetch('/api/google/my-status', { headers: { Authorization: `Bearer ${token}` } })
        const sd = await sr.json()
        isConnected = !!sd.connected
        if (isConnected) {
          const mr = await fetch('/api/google/my-freebusy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ timeMin: nowIso, timeMax: in21 }),
          })
          const md = await mr.json()
          myBusy = md.busy || []
        }
      }
      setGoogleConnected(isConnected)
      setBusy([...adminBusy, ...myBusy])
    } catch (e) { console.error('busy', e) }
  }

  const slots = useMemo(() => buildSlots(rules, appointments, busy, 21), [rules, appointments, busy])

  // Group by date key
  const slotsByDay = useMemo(() => {
    const map: Record<string, { date: Date; iso: string }[]> = {}
    for (const s of slots) {
      const k = dateKey(s.date)
      if (!map[k]) map[k] = []
      map[k].push(s)
    }
    return map
  }, [slots])

  const firstSlotRule = rules.find(r => r.enabled)
  const duration = firstSlotRule?.slotDurationMin || 30

  const handleConfirm = async () => {
    if (!selectedSlot) return
    setSubmitting(true)
    const apt = await createAppointment({
      clientId,
      scheduledAt: selectedSlot.iso,
      durationMin: duration,
      topic: topic.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setSubmitting(false)
    if (!apt) { toast.warning("Ce créneau vient d'être pris. Choisis-en un autre."); await load(); setSelectedSlot(null); return }

    // Fire confirmation email (non-blocking)
    try {
      await fetch('/api/send-booking-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: apt.id, clientName }),
      })
    } catch (e) { console.error(e) }

    setSuccess(true)
    await load()
  }

  const handleCancelClick = (a: Appointment) => setToCancel(a)

  if (loading) return <p className="text-sm text-blanc-muted text-center py-12">Chargement des créneaux...</p>

  if (rules.filter(r => r.enabled).length === 0) {
    return (
      <div className="text-center rounded-2xl" style={{ padding: '60px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' }}>
        <p className="text-sm text-blanc-muted">
          Les créneaux de rendez-vous ne sont pas encore ouverts. Reviens bientôt.
        </p>
      </div>
    )
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center rounded-2xl" style={{ padding: '56px 28px', background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.2)' }}>
        <div className="flex items-center justify-center rounded-full mx-auto" style={{ width: '60px', height: '60px', background: 'rgba(202,138,4,0.15)', border: '1px solid rgba(202,138,4,0.3)', marginBottom: '20px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h2 className="font-heading text-2xl text-blanc italic" style={{ marginBottom: '10px' }}>Rendez-vous confirmé</h2>
        <p className="text-sm text-blanc-muted/80 leading-relaxed" style={{ marginBottom: '22px' }}>
          Un email avec les détails et le lien de la visio vient de t&apos;être envoyé.
        </p>
        <button onClick={() => { setSuccess(false); setSelectedSlot(null); setTopic(''); setNotes('') }}
          className="text-xs text-gold hover:text-gold-light tracking-widest uppercase cursor-pointer"
          style={{ padding: '10px 20px', border: '1px solid rgba(202,138,4,0.4)', borderRadius: '10px' }}>
          Réserver un autre
        </button>
      </motion.div>
    )
  }

  return (
    <div>
      {/* My upcoming appointments */}
      {myAppointments.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', marginBottom: '32px' }}>
          <div className="flex items-center gap-3" style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
            <h3 className="font-heading text-base text-blanc italic">Tes rendez-vous à venir</h3>
          </div>
          <div>
            {myAppointments.map(a => {
              const d = new Date(a.scheduledAt)
              return (
                <div key={a.id} className="flex items-center gap-4" style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <p className="text-sm text-blanc font-medium">
                      {DAYS_SHORT[d.getDay()]} {d.getDate()} {MONTHS_FR[d.getMonth()].toLowerCase()} à {pad(d.getHours())}h{pad(d.getMinutes())}
                    </p>
                    {a.topic && <p className="text-xs text-blanc-muted/70" style={{ marginTop: '3px' }}>{a.topic}</p>}
                  </div>
                  <span className="flex-1" />
                  {a.meetingUrl && (
                    <a href={a.meetingUrl} className="text-xs text-gold hover:text-gold-light tracking-widest uppercase" style={{ padding: '8px 14px', border: '1px solid rgba(202,138,4,0.3)', borderRadius: '8px' }}>
                      Rejoindre
                    </a>
                  )}
                  <button onClick={() => handleCancelClick(a)} className="text-[11px] text-red-400/70 hover:text-red-400 tracking-widest uppercase cursor-pointer" style={{ padding: '8px 12px' }}>
                    Annuler
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Google prompt si pas connecte */}
      {googleConnected === false && (
        <div className="rounded-xl flex items-center gap-4 flex-wrap" style={{ padding: '14px 18px', background: 'rgba(202,138,4,0.08)', border: '1px solid rgba(202,138,4,0.25)', marginBottom: '20px' }}>
          <div className="flex items-center justify-center shrink-0" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(202,138,4,0.15)', color: '#ca8a04' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          </div>
          <div className="flex-1" style={{ minWidth: '220px' }}>
            <p className="text-sm text-blanc" style={{ marginBottom: '2px' }}>Connecte ton agenda Google</p>
            <p className="text-xs text-blanc-muted/70">Les créneaux déjà pris dans ton agenda seront masqués automatiquement. Zéro conflit possible.</p>
          </div>
          <button onClick={() => (window.location.href = `/portal/${clientId}?tab=account`)}
            className="relative inline-flex items-center gap-2 cursor-pointer" style={{ padding: '10px 18px' }}>
            <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)', border: '1px solid rgba(202,138,4,0.4)' }} />
            <span className="relative z-10 text-noir font-semibold uppercase tracking-[0.12em]" style={{ fontSize: '11px' }}>Connecter</span>
          </button>
        </div>
      )}

      {/* Available slots */}
      <div style={{ marginBottom: '16px' }}>
        <h3 className="font-heading text-xl text-blanc italic" style={{ marginBottom: '6px' }}>Réserver un appel</h3>
        <p className="text-xs text-blanc-muted/70">Choisis un créneau disponible. Appel de {duration} minutes.</p>
      </div>

      {Object.keys(slotsByDay).length === 0 ? (
        <div className="text-center rounded-2xl" style={{ padding: '40px 28px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="text-sm text-blanc-muted">Aucun créneau disponible dans les 3 prochaines semaines.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(slotsByDay).map(([key, daySlots]) => {
            const date = daySlots[0].date
            return (
              <div key={key} className="rounded-xl" style={{ padding: '18px 22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[11px] uppercase tracking-[0.15em] text-blanc-muted/60" style={{ marginBottom: '12px' }}>
                  {DAYS_SHORT[date.getDay()]} {date.getDate()} {MONTHS_FR[date.getMonth()].toLowerCase()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {daySlots.map(s => (
                    <button key={s.iso} onClick={() => setSelectedSlot(s)}
                      className="text-sm cursor-pointer transition-all"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: 'rgba(202,138,4,0.08)',
                        border: '1px solid rgba(202,138,4,0.25)',
                        color: '#ca8a04',
                      }}>
                      {pad(s.date.getHours())}h{pad(s.date.getMinutes())}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Confirm modal */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-6"
            style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}
            onClick={() => { if (!submitting) setSelectedSlot(null) }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="relative w-full rounded-3xl" style={{ maxWidth: '460px', background: 'rgba(20,20,20,0.96)', border: '1px solid rgba(255,255,255,0.08)', padding: '32px' }}>
              <h3 className="font-heading text-2xl text-blanc italic" style={{ marginBottom: '8px' }}>Confirmer</h3>
              <p className="text-sm text-blanc-muted/80" style={{ marginBottom: '20px' }}>
                {DAYS_SHORT[selectedSlot.date.getDay()]} {selectedSlot.date.getDate()} {MONTHS_FR[selectedSlot.date.getMonth()].toLowerCase()} à {pad(selectedSlot.date.getHours())}h{pad(selectedSlot.date.getMinutes())} &middot; {duration} min
              </p>

              <label className="text-[10px] text-blanc-muted/60 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Sujet du call (optionnel)</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Ex: point stratégie de contenu"
                style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fafaf9', fontSize: '14px', padding: '12px 14px', outline: 'none', marginBottom: '14px', fontFamily: 'inherit' }} />

              <label className="text-[10px] text-blanc-muted/60 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Note (optionnel)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Infos utiles pour préparer le call" rows={3}
                style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fafaf9', fontSize: '14px', padding: '12px 14px', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />

              <div className="flex items-center gap-3" style={{ marginTop: '24px' }}>
                <button onClick={() => { if (!submitting) setSelectedSlot(null) }} disabled={submitting}
                  className="flex-1 text-blanc text-sm font-medium hover:bg-white/[0.03] cursor-pointer disabled:opacity-40"
                  style={{ padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  Annuler
                </button>
                <button onClick={handleConfirm} disabled={submitting}
                  className="group relative flex-1 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  style={{ padding: '12px 18px' }}>
                  <div className="absolute inset-0 rounded-xl" style={{ background: 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)', border: '1px solid rgba(202,138,4,0.4)' }} />
                  <span className="relative z-10 text-noir font-semibold uppercase tracking-[0.12em]" style={{ fontSize: '12px' }}>
                    {submitting ? 'Réservation...' : 'Confirmer'}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!toCancel}
        danger
        title="Annuler ce rendez-vous ?"
        message={
          toCancel
            ? `Le rendez-vous du ${DAYS_SHORT[new Date(toCancel.scheduledAt).getDay()]} ${new Date(toCancel.scheduledAt).getDate()} ${MONTHS_FR[new Date(toCancel.scheduledAt).getMonth()].toLowerCase()} à ${pad(new Date(toCancel.scheduledAt).getHours())}h${pad(new Date(toCancel.scheduledAt).getMinutes())} sera annulé. Tu pourras en reprendre un autre si tu veux.`
            : ''
        }
        confirmLabel={cancelling ? 'Annulation…' : 'Annuler le RDV'}
        cancelLabel="Retour"
        onCancel={() => { if (!cancelling) setToCancel(null) }}
        onConfirm={async () => {
          if (!toCancel || cancelling) return
          setCancelling(true)
          const ok = await cancelAppointment(toCancel.id, { byAdmin: false })
          setCancelling(false)
          if (ok) await load()
          setToCancel(null)
        }}
      />
    </div>
  )
}
