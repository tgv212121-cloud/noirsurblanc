'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { updatePassword } from '@/lib/auth'
import { useToast } from './Toast'

export default function ChangePasswordCard() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (next.length < 6) { toast.warning('Mot de passe trop court (6 caractères minimum).'); return }
    if (next !== confirm) { toast.warning('Les deux mots de passe ne correspondent pas.'); return }

    setSaving(true)
    // Vérifie le mot de passe actuel en retentant une connexion
    const { data: userData } = await supabase.auth.getUser()
    const email = userData.user?.email
    if (!email) { toast.error('Session invalide. Reconnecte-toi.'); setSaving(false); return }

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current })
    if (signInErr) {
      toast.error('Mot de passe actuel incorrect.')
      setSaving(false)
      return
    }

    const { error } = await updatePassword(next)
    setSaving(false)
    if (error) { toast.error('Erreur : ' + error); return }

    setCurrent(''); setNext(''); setConfirm('')
    toast.success('Mot de passe modifié.')
  }

  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    color: '#fafaf9',
    fontSize: '14px',
    padding: '12px 42px 12px 14px',
    outline: 'none',
    fontFamily: 'inherit',
  }

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ ...cardStyle, marginBottom: '24px' }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
        <h2 className="font-heading text-lg text-blanc italic">Mot de passe</h2>
      </div>

      <form onSubmit={submit} style={{ padding: '24px' }}>
        <p className="text-xs text-blanc-muted/70 leading-relaxed" style={{ marginBottom: '20px' }}>
          Change ton mot de passe ici. 6 caractères minimum.
        </p>

        <div style={{ marginBottom: '14px' }}>
          <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '8px' }}>Mot de passe actuel</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={current} onChange={e => setCurrent(e.target.value)}
              placeholder="••••••••" autoComplete="current-password" style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '8px' }}>Nouveau mot de passe</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={next} onChange={e => setNext(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" minLength={6} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '8px' }}>Confirmer</label>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••" autoComplete="new-password" style={inputStyle} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-xs text-blanc-muted/60 cursor-pointer" style={{ marginBottom: '20px' }}>
          <input type="checkbox" checked={show} onChange={e => setShow(e.target.checked)}
            style={{ accentColor: '#ca8a04', width: '14px', height: '14px' }} />
          Afficher les mots de passe
        </label>

        <button type="submit" disabled={saving} className="nsb-btn nsb-btn-primary" style={{ padding: '13px 28px' }}>
          {saving ? 'Enregistrement…' : 'Mettre à jour'}
        </button>
      </form>
    </div>
  )
}
