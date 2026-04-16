'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { fetchClients, deleteClient } from '@/lib/queries'
import PulseButton from '@/components/ui/PulseButton'
import { GooeyInput } from '@/components/ui/GooeyInput'
import ConfirmModal from '@/components/ui/ConfirmModal'
import InviteClientModal from '@/components/ui/InviteClientModal'
import type { Client } from '@/types'
import { motion } from 'framer-motion'

export default function ClientsPage() {
  const router = useRouter()
  const { checking } = useAuthGuard({ requireRole: 'admin' })
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [toDelete, setToDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchClients().then(c => { setClients(c); setLoading(false) })
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q)
    )
  }, [clients, search])

  if (checking) return <p className="text-sm text-blanc-muted text-center py-20">Chargement...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between" style={{ marginBottom: '36px' }}>
        <div>
          <h1 className="font-heading text-4xl font-medium text-blanc italic leading-none" style={{ marginBottom: '10px' }}>Clients</h1>
          <p className="text-sm text-blanc-muted/70">{clients.length} client{clients.length > 1 ? 's' : ''}</p>
        </div>
        <PulseButton onClick={() => setInviteOpen(true)}>
          + Inviter un client
        </PulseButton>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '28px' }}>
        <GooeyInput
          buttonLabel="Rechercher"
          placeholder="Nom du client..."
          value={search}
          onValueChange={setSearch}
          collapsedWidth={140}
          expandedWidth={260}
          expandedOffset={40}
        />
      </div>

      {/* Grid of client cards */}
      {loading ? (
        <p className="text-sm text-blanc-muted text-center py-20">Chargement...</p>
      ) : filtered.length === 0 ? (
        <div className="relative rounded-2xl overflow-hidden text-center"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)', padding: '60px 28px' }}>
          <p className="text-sm text-blanc-muted">
            {search ? `Aucun client ne correspond à "${search}".` : "Aucun client pour l'instant. Clique sur “Inviter un client”."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.03, 0.3) }}
              >
                <button
                  onClick={() => router.push(`/clients/${c.id}`)}
                  className="group relative w-full text-left rounded-2xl overflow-hidden cursor-pointer transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    padding: '22px 26px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.045)'
                    e.currentTarget.style.borderColor = 'rgba(202,138,4,0.25)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
                  }}
                >
                  <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                  {/* Delete button (top-right, appears on hover) */}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setToDelete(c)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        setToDelete(c)
                      }
                    }}
                    title="Supprimer"
                    className="absolute flex items-center justify-center rounded-md text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                    style={{ top: '12px', right: '12px', width: '28px', height: '28px' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </span>

                  {/* Name */}
                  <p className="text-[15px] font-medium text-blanc truncate group-hover:text-gold transition-colors duration-200">
                    {c.name}
                  </p>
                  {c.company && (
                    <p className="text-xs text-blanc-muted/65 truncate" style={{ marginTop: '4px' }}>
                      {c.company}
                    </p>
                  )}
                </button>
              </motion.div>
          ))}
        </div>
      )}

      <InviteClientModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onCreated={(c) => { setClients(prev => [c, ...prev]) }}
      />

      <ConfirmModal
        open={!!toDelete}
        danger
        title="Supprimer ce client ?"
        message={
          toDelete
            ? `${toDelete.name}${toDelete.company ? ' · ' + toDelete.company : ''} sera supprimé définitivement. Tous ses posts, messages, réponses d'onboarding et métriques le seront aussi. Cette action est irréversible.`
            : ''
        }
        confirmLabel={deleting ? 'Suppression…' : 'Supprimer'}
        cancelLabel="Annuler"
        onCancel={() => { if (!deleting) setToDelete(null) }}
        onConfirm={async () => {
          if (!toDelete || deleting) return
          setDeleting(true)
          const done = await deleteClient(toDelete.id)
          setDeleting(false)
          if (!done) { alert("Erreur lors de la suppression."); return }
          setClients(prev => prev.filter(x => x.id !== toDelete.id))
          setToDelete(null)
        }}
      />
    </div>
  )
}
