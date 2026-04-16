'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyProfile, listProfiles, signUp, signOut, type Profile } from '@/lib/auth'
import { fetchClients, exportAllData, fetchAvailabilityRules, upsertAvailabilityRule, deleteAvailabilityRule } from '@/lib/queries'
import type { Client, AvailabilityRule } from '@/types'
import { motion } from 'framer-motion'

export default function SettingsPage() {
  const router = useRouter()
  const [me, setMe] = useState<Profile | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'admin' | 'client'>('admin')
  const [newClientId, setNewClientId] = useState('')
  const [creating, setCreating] = useState(false)
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null)
  const [exporting, setExporting] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(null)
  const [rules, setRules] = useState<AvailabilityRule[]>([])

  useEffect(() => {
    (async () => {
      const p = await getMyProfile()
      if (!p) { router.push('/login'); return }
      if (p.role !== 'admin') { router.push('/'); return }
      setMe(p)
      const [allP, allC, allR] = await Promise.all([listProfiles(), fetchClients(), fetchAvailabilityRules()])
      setProfiles(allP); setClients(allC); setRules(allR); setLoading(false)
      if (typeof window !== 'undefined') {
        setLastExport(localStorage.getItem('noirsurblanc:lastExport'))
      }
    })()
  }, [router])

  const handleExport = async () => {
    setExporting(true)
    try {
      const data = await exportAllData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.href = url
      a.download = `noirsurblanc-backup-${ts}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      const now = new Date().toISOString()
      localStorage.setItem('noirsurblanc:lastExport', now)
      setLastExport(now)
    } catch (e) {
      console.error(e)
      alert("Erreur pendant l'export. Réessaye.")
    } finally {
      setExporting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setFeedback(null)
    const { error } = await signUp(newEmail, newPassword, {
      role: newRole,
      clientId: newRole === 'client' ? newClientId || null : null,
    })
    setCreating(false)
    if (error) { setFeedback({ kind: 'err', msg: error }); return }
    setFeedback({ kind: 'ok', msg: 'Compte créé. L\'utilisateur peut se connecter sur /login.' })
    setNewEmail(''); setNewPassword(''); setNewClientId('')
    const allP = await listProfiles()
    setProfiles(allP)
  }

  const handleLogout = async () => { await signOut(); router.push('/login') }

  if (loading) return <p className="text-sm text-blanc-muted text-center py-20">Chargement...</p>
  if (!me) return null

  const clientsById = Object.fromEntries(clients.map(c => [c.id, c]))
  const adminCount = profiles.filter(p => p.role === 'admin').length
  const clientCount = profiles.filter(p => p.role === 'client').length

  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '12px',
    color: '#fafaf9',
    fontSize: '14px',
    padding: '14px 16px',
    outline: 'none',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between" style={{ marginBottom: '36px' }}>
        <div>
          <h1 className="font-heading text-4xl font-medium text-blanc italic leading-none" style={{ marginBottom: '10px' }}>Paramètres</h1>
          <p className="text-sm text-blanc-muted/70">Gestion des comptes et des rôles</p>
        </div>
        <button onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm text-blanc-muted hover:text-blanc rounded-xl cursor-pointer transition-colors"
          style={{ padding: '10px 18px', border: '1px solid rgba(255,255,255,0.09)' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
          Déconnexion
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-3 gap-5" style={{ marginBottom: '40px' }}>
        <StatMini label="Mon rôle" value={me.role.toUpperCase()} accent sub={me.email || '-'} />
        <StatMini label="Administrateurs" value={adminCount.toString()} />
        <StatMini label="Comptes clients" value={clientCount.toString()} />
      </div>

      {/* Backup card */}
      <div className="relative rounded-2xl overflow-hidden" style={{ ...cardStyle, marginBottom: '24px' }}>
        <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
          <h2 className="font-heading text-lg text-blanc italic">Sauvegarde des données</h2>
        </div>
        <div className="flex items-start justify-between gap-6 flex-wrap" style={{ padding: '24px' }}>
          <div className="flex-1" style={{ minWidth: '280px' }}>
            <p className="text-sm text-blanc/90 leading-relaxed" style={{ marginBottom: '8px' }}>
              Exporte tout ton compte Noirsurblanc en un clic : clients, posts, messages, réponses d&apos;onboarding, stats.
            </p>
            <p className="text-xs text-blanc-muted/70 leading-relaxed">
              Garde ce fichier en lieu sûr (Drive, Dropbox, disque externe). Fais-le une fois par semaine pour être serein.
            </p>
            {lastExport && (
              <p className="text-xs text-gold/80" style={{ marginTop: '12px' }}>
                Dernière sauvegarde : {new Date(lastExport).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            )}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="group relative flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40 shrink-0"
            style={{ padding: '14px 28px' }}
          >
            <div className="absolute inset-0 rounded-xl bg-gold/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
            <svg className="relative z-10 text-noir" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
            </svg>
            <span className="relative z-10 text-noir font-semibold tracking-[0.12em] uppercase" style={{ fontSize: '12px' }}>
              {exporting ? 'Export…' : 'Télécharger la sauvegarde'}
            </span>
          </button>
        </div>
      </div>

      {/* Availability (calendar slots for client bookings) */}
      <AvailabilityCard rules={rules} onChange={async () => { setRules(await fetchAvailabilityRules()) }} />

      {/* Two columns : create form + list */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-6">

        {/* Users list */}
        <div className="relative rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
            <h2 className="font-heading text-lg text-blanc italic">Utilisateurs</h2>
            <span className="ml-auto text-xs text-blanc-muted/60">{profiles.length} compte{profiles.length > 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-[1fr_100px_1fr]" style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
            <span className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em]">Email</span>
            <span className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em]">Rôle</span>
            <span className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em]">Client lié</span>
          </div>
          <div>
            {profiles.length === 0 ? (
              <p className="text-sm text-blanc-muted/60 text-center" style={{ padding: '32px 24px' }}>Aucun compte pour l&apos;instant.</p>
            ) : profiles.map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_100px_1fr] items-center gap-2"
                style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-sm text-blanc truncate">{p.email || '-'}</span>
                <span>
                  {p.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-semibold text-gold"
                      style={{ background: 'rgba(202,138,4,0.1)', border: '1px solid rgba(202,138,4,0.3)', borderRadius: '999px', padding: '4px 10px' }}>
                      <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', background: '#ca8a04' }} />
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] font-medium text-blanc-muted"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '999px', padding: '4px 10px' }}>
                      <span className="inline-block rounded-full" style={{ width: '5px', height: '5px', background: 'rgba(255,255,255,0.3)' }} />
                      Client
                    </span>
                  )}
                </span>
                <span className="text-sm text-blanc-muted/70 truncate">
                  {p.clientId ? (clientsById[p.clientId]?.name || p.clientId) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Create account */}
        <div className="relative rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
            <h2 className="font-heading text-lg text-blanc italic">Nouveau compte</h2>
          </div>

          <form onSubmit={handleCreate} style={{ padding: '24px' }}>
            <div style={{ marginBottom: '18px' }}>
              <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '10px' }}>Email</label>
              <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="nouveau@email.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '10px' }}>Mot de passe</label>
              <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••" style={inputStyle} />
              <p className="text-[11px] text-blanc-muted/40" style={{ marginTop: '6px' }}>Minimum 6 caractères.</p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '10px' }}>Rôle</label>
              <div className="flex gap-2">
                {(['admin', 'client'] as const).map(r => (
                  <button key={r} type="button" onClick={() => setNewRole(r)}
                    className="flex-1 rounded-xl text-sm font-medium cursor-pointer transition-all"
                    style={{
                      padding: '12px 16px',
                      background: newRole === r ? 'rgba(202,138,4,0.12)' : 'rgba(255,255,255,0.025)',
                      border: `1px solid ${newRole === r ? 'rgba(202,138,4,0.4)' : 'rgba(255,255,255,0.08)'}`,
                      color: newRole === r ? '#ca8a04' : '#a8a29e',
                    }}>
                    {r === 'admin' ? 'Administrateur' : 'Client'}
                  </button>
                ))}
              </div>
            </div>

            {newRole === 'client' && (
              <div style={{ marginBottom: '18px' }}>
                <label className="text-[10px] text-blanc-muted/60 uppercase tracking-[0.14em] block" style={{ marginBottom: '10px' }}>Lier au client</label>
                <select value={newClientId} onChange={e => setNewClientId(e.target.value)} style={inputStyle}>
                  <option value="" style={{ background: '#141414', color: '#fafaf9' }}>Sélectionner...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id} style={{ background: '#141414', color: '#fafaf9' }}>
                      {c.name}{c.company ? ' · ' + c.company : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {feedback && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs" style={{ marginBottom: '16px', color: feedback.kind === 'ok' ? '#ca8a04' : '#f87171' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {feedback.kind === 'ok' ? (
                    <polyline points="20 6 9 17 4 12" />
                  ) : (
                    <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>
                  )}
                </svg>
                {feedback.msg}
              </motion.p>
            )}

            <button type="submit" disabled={creating}
              className="group relative flex items-center justify-center gap-3 w-full cursor-pointer disabled:opacity-40"
              style={{ padding: '16px', marginTop: '6px' }}>
              <div className="absolute inset-0 rounded-xl bg-gold/25 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-gold-dark via-gold to-gold-light border border-gold/30" />
              <span className="relative z-10 text-noir font-semibold tracking-[0.12em] uppercase" style={{ fontSize: '12px' }}>
                {creating ? 'Création…' : 'Créer le compte'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function StatMini({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="relative rounded-2xl overflow-hidden"
      style={{
        background: accent ? 'linear-gradient(135deg, rgba(202,138,4,0.08), rgba(202,138,4,0.02))' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${accent ? 'rgba(202,138,4,0.25)' : 'rgba(255,255,255,0.09)'}`,
        padding: '20px 22px',
      }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <p className="text-[11px] text-blanc-muted/60 uppercase tracking-[0.14em]" style={{ marginBottom: '10px' }}>{label}</p>
      <p className={`font-heading font-medium leading-none ${accent ? 'text-gold italic' : 'text-blanc'}`} style={{ fontSize: '28px' }}>{value}</p>
      {sub && <p className="text-xs text-blanc-muted/60 truncate" style={{ marginTop: '8px' }}>{sub}</p>}
    </div>
  )
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function AvailabilityCard({ rules, onChange }: { rules: AvailabilityRule[]; onChange: () => void }) {
  const [saving, setSaving] = useState(false)
  const [newDay, setNewDay] = useState(1)
  const [newStart, setNewStart] = useState('10:00')
  const [newEnd, setNewEnd] = useState('12:00')
  const [newDuration, setNewDuration] = useState(30)

  const addRule = async () => {
    if (newStart >= newEnd) { alert('Heure de fin doit être après heure de début.'); return }
    setSaving(true)
    const ok = await upsertAvailabilityRule({
      dayOfWeek: newDay, startTime: newStart + ':00', endTime: newEnd + ':00',
      slotDurationMin: newDuration, enabled: true,
    })
    setSaving(false)
    if (!ok) { alert("Erreur. Est-ce que tu as bien lancé la migration SQL ?"); return }
    onChange()
  }

  const toggleRule = async (r: AvailabilityRule) => {
    await upsertAvailabilityRule({ ...r, enabled: !r.enabled })
    onChange()
  }

  const removeRule = async (id: string) => {
    if (!confirm('Supprimer ce créneau ?')) return
    await deleteAvailabilityRule(id)
    onChange()
  }

  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const

  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ ...cardStyle, marginBottom: '24px' }}>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
        <h2 className="font-heading text-lg text-blanc italic">Disponibilités rendez-vous</h2>
      </div>

      <div style={{ padding: '24px' }}>
        <p className="text-xs text-blanc-muted/70 leading-relaxed" style={{ marginBottom: '20px' }}>
          Définis tes créneaux hebdomadaires récurrents. Tes clients pourront réserver un appel 30&thinsp;min (ou autre durée) depuis leur portail sur ces plages.
        </p>

        {/* Existing rules */}
        {rules.length > 0 && (
          <div className="space-y-2" style={{ marginBottom: '20px' }}>
            {rules.map(r => (
              <div key={r.id} className="flex items-center gap-4 rounded-xl"
                style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', opacity: r.enabled ? 1 : 0.5 }}>
                <span className="text-sm text-blanc font-medium" style={{ minWidth: '100px' }}>{DAYS_FR[r.dayOfWeek]}</span>
                <span className="text-sm text-blanc-muted">{r.startTime.slice(0, 5)} &rarr; {r.endTime.slice(0, 5)}</span>
                <span className="text-xs text-gold">{r.slotDurationMin} min</span>
                <span className="flex-1" />
                <button onClick={() => toggleRule(r)} className="text-[11px] uppercase tracking-wider text-blanc-muted hover:text-blanc cursor-pointer" style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)' }}>
                  {r.enabled ? 'Actif' : 'Pause'}
                </button>
                <button onClick={() => removeRule(r.id)} className="text-red-400/70 hover:text-red-400 cursor-pointer" style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New rule form */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end rounded-xl" style={{ padding: '16px', background: 'rgba(255,255,255,0.015)', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div>
            <label className="text-[10px] text-blanc-muted/60 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Jour</label>
            <select value={newDay} onChange={e => setNewDay(parseInt(e.target.value))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafaf9', fontSize: '13px', padding: '8px 10px', outline: 'none' }}>
              {DAYS_FR.map((d, i) => <option key={i} value={i} style={{ background: '#141414', color: '#fafaf9' }}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-blanc-muted/60 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Début</label>
            <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafaf9', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
          </div>
          <div>
            <label className="text-[10px] text-blanc-muted/60 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Fin</label>
            <input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafaf9', fontSize: '13px', padding: '8px 10px', outline: 'none' }} />
          </div>
          <div>
            <label className="text-[10px] text-blanc-muted/60 uppercase tracking-wider block" style={{ marginBottom: '6px' }}>Durée</label>
            <select value={newDuration} onChange={e => setNewDuration(parseInt(e.target.value))}
              style={{ width: '100%', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fafaf9', fontSize: '13px', padding: '8px 10px', outline: 'none' }}>
              {[15, 30, 45, 60].map(d => <option key={d} value={d} style={{ background: '#141414', color: '#fafaf9' }}>{d} min</option>)}
            </select>
          </div>
          <button onClick={addRule} disabled={saving}
            className="rounded-xl text-noir font-semibold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-40"
            style={{ padding: '10px 16px', background: 'linear-gradient(135deg,#a16207,#ca8a04,#eab308)', border: '1px solid rgba(202,138,4,0.4)' }}>
            {saving ? '...' : '+ Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
