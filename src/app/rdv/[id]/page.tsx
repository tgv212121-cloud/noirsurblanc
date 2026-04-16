'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

const MEETING_URL = process.env.NEXT_PUBLIC_MEETING_URL || ''

type Appointment = {
  id: string
  client_id: string
  scheduled_at: string
  duration_min: number
  status: string
  topic: string | null
  notes: string | null
}

type Client = { name: string; company: string | null }

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const pad = (n: number) => n.toString().padStart(2, '0')

export default function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [apt, setApt] = useState<Appointment | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: a } = await supabase.from('appointments').select('*').eq('id', id).maybeSingle()
      if (!a) { setLoading(false); return }
      setApt(a as Appointment)
      const { data: c } = await supabase.from('clients').select('name, company').eq('id', a.client_id).maybeSingle()
      setClient(c as Client | null)
      setLoading(false)
    })()
  }, [id])

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full blur-[200px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.10), transparent 70%)' }} />
        <div className="absolute -bottom-60 -right-60 w-[900px] h-[900px] rounded-full blur-[220px]" style={{ background: 'radial-gradient(circle, rgba(201,169,97,0.06), transparent 70%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full" style={{ maxWidth: '520px' }}>

          <div className="text-center" style={{ marginBottom: '48px' }}>
            <h1 className="font-heading font-bold tracking-tight text-blanc leading-none" style={{ fontSize: 'clamp(44px, 7vw, 64px)' }}>
              Noir<span className="text-gold italic">sur</span>blanc
            </h1>
            <p className="text-blanc-muted/60 text-[11px] tracking-[0.35em] uppercase" style={{ marginTop: '18px' }}>Rendez-vous</p>
          </div>

          <div className="relative rounded-3xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', padding: '40px 36px' }}>
            <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

            {loading ? (
              <p className="text-sm text-blanc-muted text-center py-8">Chargement...</p>
            ) : !apt ? (
              <p className="text-sm text-blanc-muted text-center py-8">Rendez-vous introuvable ou annulé.</p>
            ) : apt.status === 'cancelled' ? (
              <p className="text-sm text-red-400/80 text-center py-8">Ce rendez-vous a été annulé.</p>
            ) : (
              <>
                <div className="text-center" style={{ marginBottom: '28px' }}>
                  <p className="text-[11px] text-blanc-muted/60 uppercase tracking-[0.16em]" style={{ marginBottom: '10px' }}>
                    {(() => { const d = new Date(apt.scheduled_at); return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}` })()}
                  </p>
                  <p className="font-heading text-blanc italic" style={{ fontSize: '40px', lineHeight: 1 }}>
                    {(() => { const d = new Date(apt.scheduled_at); return `${pad(d.getHours())}h${pad(d.getMinutes())}` })()}
                  </p>
                  <p className="text-sm text-blanc-muted/70" style={{ marginTop: '10px' }}>
                    {apt.duration_min} minutes{client ? ' · avec ' + client.name : ''}
                  </p>
                </div>

                {apt.topic && (
                  <div className="rounded-xl" style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '14px' }}>
                    <p className="text-[10px] text-blanc-muted/60 uppercase tracking-wider" style={{ marginBottom: '4px' }}>Sujet</p>
                    <p className="text-sm text-blanc">{apt.topic}</p>
                  </div>
                )}

                {apt.notes && (
                  <div className="rounded-xl" style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
                    <p className="text-[10px] text-blanc-muted/60 uppercase tracking-wider" style={{ marginBottom: '4px' }}>Notes</p>
                    <p className="text-sm text-blanc-muted/90 leading-relaxed whitespace-pre-line">{apt.notes}</p>
                  </div>
                )}

                {MEETING_URL ? (
                  <a href={MEETING_URL} target="_blank" rel="noopener noreferrer"
                    className="group relative flex items-center justify-center gap-3 w-full cursor-pointer"
                    style={{ padding: '16px 24px', marginTop: '12px' }}>
                    <div className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)', border: '1px solid rgba(202,138,4,0.4)' }} />
                    <span className="relative z-10 text-noir font-semibold tracking-[0.14em] uppercase" style={{ fontSize: '12px' }}>
                      Rejoindre l&apos;appel
                    </span>
                    <svg className="relative z-10 text-noir" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </a>
                ) : (
                  <p className="text-xs text-blanc-muted/60 text-center italic" style={{ marginTop: '16px' }}>
                    Le lien de la visio sera communiqué sous peu.
                  </p>
                )}
              </>
            )}
          </div>

          <p className="text-center text-xs text-blanc-muted/50" style={{ marginTop: '28px' }}>
            <Link href="/login" className="hover:text-gold transition-colors">Retour à ton espace</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
