'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyProfile, listProfiles, signUp, signOut, type Profile } from '@/lib/auth'
import { fetchClients } from '@/lib/queries'
import type { Client } from '@/types'
import { cn } from '@/lib/utils'

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
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const p = await getMyProfile()
      if (!p) { router.push('/login'); return }
      if (p.role !== 'admin') { router.push('/'); return }
      setMe(p)
      const [allP, allC] = await Promise.all([listProfiles(), fetchClients()])
      setProfiles(allP); setClients(allC); setLoading(false)
    })()
  }, [router])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true); setFeedback(null)
    const { error } = await signUp(newEmail, newPassword, {
      role: newRole,
      clientId: newRole === 'client' ? newClientId || null : null,
    })
    setCreating(false)
    if (error) { setFeedback('Erreur : ' + error); return }
    setFeedback('Compte créé. Ils peuvent se connecter sur /login.')
    setNewEmail(''); setNewPassword(''); setNewClientId('')
    const allP = await listProfiles()
    setProfiles(allP)
  }

  const handleLogout = async () => { await signOut(); router.push('/login') }

  if (loading) return <p className="text-blanc-muted text-center py-20">Chargement...</p>
  if (!me) return null

  const clientsById = Object.fromEntries(clients.map(c => [c.id, c]))

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-blanc">Paramètres</h1>
          <p className="text-sm text-blanc-muted mt-1">Gestion des comptes et des rôles</p>
        </div>
        <button onClick={handleLogout}
          className="text-sm text-blanc-muted hover:text-blanc border border-border px-4 py-2 rounded-xl cursor-pointer transition-colors">
          Déconnexion
        </button>
      </div>

      {/* Current user */}
      <div className="mb-10 p-5 rounded-xl bg-noir-card border border-border">
        <p className="text-xs text-blanc-muted uppercase tracking-wider mb-1">Connecté en tant que</p>
        <p className="text-sm text-blanc">{me.email} <span className="ml-2 text-gold text-xs uppercase tracking-wider">{me.role}</span></p>
      </div>

      {/* New account form */}
      <div className="mb-10 p-6 rounded-xl bg-noir-card border border-border">
        <h2 className="text-base font-semibold text-blanc mb-4">Créer un nouveau compte</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-wider block mb-2">Email</label>
              <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                className="w-full bg-noir-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-blanc outline-none focus:border-gold/30" />
            </div>
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-wider block mb-2">Mot de passe (≥ 6 caractères)</label>
              <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-noir-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-blanc outline-none focus:border-gold/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-blanc-muted uppercase tracking-wider block mb-2">Rôle</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value as 'admin' | 'client')}
                className="w-full bg-noir-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-blanc outline-none focus:border-gold/30">
                <option value="admin">Admin</option>
                <option value="client">Client</option>
              </select>
            </div>
            {newRole === 'client' && (
              <div>
                <label className="text-[10px] text-blanc-muted uppercase tracking-wider block mb-2">Lier au client</label>
                <select value={newClientId} onChange={e => setNewClientId(e.target.value)}
                  className="w-full bg-noir-elevated border border-border rounded-lg px-4 py-2.5 text-sm text-blanc outline-none focus:border-gold/30">
                  <option value="">— Sélectionner —</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} — {c.company}</option>)}
                </select>
              </div>
            )}
          </div>
          <button type="submit" disabled={creating}
            className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gold text-noir font-semibold text-sm cursor-pointer disabled:opacity-40">
            {creating ? 'Création...' : 'Créer le compte'}
          </button>
          {feedback && <p className="text-xs mt-2 text-blanc-muted">{feedback}</p>}
        </form>
      </div>

      {/* List of profiles */}
      <div className="rounded-xl bg-noir-card border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_1fr] gap-4 px-6 py-4 text-[10px] text-blanc-muted uppercase tracking-wider font-semibold border-b border-border bg-noir-elevated">
          <span>Email</span><span>Rôle</span><span>Client lié</span>
        </div>
        {profiles.length === 0 ? (
          <p className="text-sm text-blanc-muted text-center py-8">Aucun compte pour l'instant.</p>
        ) : profiles.map(p => (
          <div key={p.id} className="grid grid-cols-[1fr_120px_1fr] gap-4 px-6 py-4 text-sm border-b border-border last:border-0">
            <span className="text-blanc">{p.email || '—'}</span>
            <span className={cn('text-xs uppercase tracking-wider font-medium',
              p.role === 'admin' ? 'text-gold' : 'text-blanc-muted')}>{p.role}</span>
            <span className="text-blanc-muted">
              {p.clientId ? (clientsById[p.clientId]?.name || p.clientId) : '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
