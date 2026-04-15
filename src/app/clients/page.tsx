'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/lib/useAuthGuard'
import { fetchClients, fetchPosts, fetchMetrics, deleteClient } from '@/lib/queries'
import { formatRelative } from '@/lib/utils'
import PulseButton from '@/components/ui/PulseButton'
import { GooeyInput } from '@/components/ui/GooeyInput'
import { DataTable } from '@/components/ui/DataTable'
import ConfirmModal from '@/components/ui/ConfirmModal'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import type { Client, Post, PostMetrics } from '@/types'

// Enriched row type
type ClientRow = Client & {
  postCount: number
  avgEngagement: number | null
  lastPostDate: string | null
}

export default function ClientsPage() {
  const router = useRouter()
  const { checking } = useAuthGuard({ requireRole: 'admin' })
  const [search, setSearch] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [toDelete, setToDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchClients(), fetchPosts(), fetchMetrics()]).then(([c, p, m]) => {
      setClients(c); setPosts(p); setMetrics(m); setLoading(false)
    })
  }, [])

  // Build enriched rows
  const rows: ClientRow[] = useMemo(() => {
    return clients
      .map(client => {
        const clientPosts = posts.filter(p => p.clientId === client.id && p.status === 'published')
        const clientMetrics = clientPosts.map(p => metrics.find(m => m.postId === p.id)).filter(Boolean)
        const avgEng = clientMetrics.length > 0
          ? clientMetrics.reduce((s, m) => s + m!.engagementRate, 0) / clientMetrics.length
          : null
        const lastPost = [...clientPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]
        return {
          ...client,
          postCount: clientPosts.length,
          avgEngagement: avgEng,
          lastPostDate: lastPost?.publishedAt || null,
        }
      })
  }, [clients, posts, metrics])

  const columns: ColumnDef<ClientRow>[] = useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blanc-muted hover:text-blanc cursor-pointer"
        >
          Client <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm font-medium text-blanc">{row.original.name}</span>
      ),
    },
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blanc-muted hover:text-blanc cursor-pointer"
        >
          Entreprise <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm text-blanc-muted">{row.original.company}</span>,
    },
    {
      accessorKey: 'postCount',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blanc-muted hover:text-blanc cursor-pointer"
        >
          Posts <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => <span className="text-sm text-blanc font-medium">{row.original.postCount}</span>,
    },
    {
      accessorKey: 'avgEngagement',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blanc-muted hover:text-blanc cursor-pointer"
        >
          Engagement <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-gold font-medium">
          {row.original.avgEngagement !== null ? `${row.original.avgEngagement.toFixed(1)}%` : '—'}
        </span>
      ),
    },
    {
      accessorKey: 'lastPostDate',
      header: ({ column }) => (
        <button
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blanc-muted hover:text-blanc cursor-pointer"
        >
          Dernier post <ArrowUpDown className="w-3 h-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-sm text-blanc-muted">
          {row.original.lastPostDate ? formatRelative(row.original.lastPostDate) : '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => null,
      size: 48,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setToDelete(row.original)
            }}
            title="Supprimer"
            className="inline-flex items-center justify-center rounded-md text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            style={{ width: '28px', height: '28px' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      ),
    },
  ], [])

  if (checking) return <p className="text-sm text-blanc-muted text-center py-20">Chargement...</p>

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-blanc">Clients</h1>
          <p className="text-sm text-blanc-muted mt-1">{rows.length} clients</p>
        </div>
        <PulseButton
          onClick={() => {
            const name = prompt('Nom complet du client ?')
            if (!name) return
            const company = prompt('Entreprise ?') || ''
            const email = prompt('Email ?') || ''
            import('@/lib/queries').then(({ createClient }) =>
              createClient({ name, company, email }).then(c => {
                if (!c) { alert('Erreur création'); return }
                const url = `${window.location.origin}/onboarding?client=${c.id}`
                navigator.clipboard.writeText(url)
                alert(`Lien d'onboarding copié :\n\n${url}\n\nEnvoie-le au client par WhatsApp / email.`)
                window.location.reload()
              })
            )
          }}
        >
          + Inviter un client
        </PulseButton>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-5 mb-6">
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

      {/* DataTable shadcn */}
      <DataTable
        columns={columns}
        data={rows}
        globalFilter={search}
        onRowClick={(row) => router.push(`/clients/${row.id}`)}
      />

      <ConfirmModal
        open={!!toDelete}
        danger
        title="Supprimer ce client ?"
        message={
          toDelete
            ? `${toDelete.name}${toDelete.company ? ' — ' + toDelete.company : ''} sera supprimé définitivement. Tous ses posts, messages, réponses d'onboarding et métriques le seront aussi. Cette action est irréversible.`
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
          setClients(prev => prev.filter(c => c.id !== toDelete.id))
          setToDelete(null)
        }}
      />
    </div>
  )
}
