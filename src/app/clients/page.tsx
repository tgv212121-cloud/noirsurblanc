'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchClients, fetchPosts, fetchMetrics } from '@/lib/queries'
import { formatRelative, cn } from '@/lib/utils'
import GooeyNav from '@/components/ui/GooeyNavComponent'
import PulseButton from '@/components/ui/PulseButton'
import { GooeyInput } from '@/components/ui/GooeyInput'
import { DataTable } from '@/components/ui/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'
import type { Client, Post, PostMetrics, ClientStatus } from '@/types'

const STATUSES: { value: ClientStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'paused', label: 'En pause' },
]

// Enriched row type
type ClientRow = Client & {
  postCount: number
  avgEngagement: number | null
  lastPostDate: string | null
}

export default function ClientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all')
  const [clients, setClients] = useState<Client[]>([])
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
      .filter(c => statusFilter === 'all' || c.status === statusFilter)
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
  }, [clients, posts, metrics, statusFilter])

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
      accessorKey: 'status',
      header: 'Statut',
      cell: ({ row }) => {
        const config: Record<string, { label: string; cls: string }> = {
          active: { label: 'Actif', cls: 'bg-emerald-50 text-emerald-600' },
          onboarding: { label: 'Onboarding', cls: 'bg-blue-50 text-blue-600' },
          paused: { label: 'En pause', cls: 'bg-gray-100 text-gray-500' },
        }
        const s = config[row.original.status]
        return <span className={cn('text-xs font-medium px-2.5 py-1 rounded inline-block', s.cls)}>{s.label}</span>
      },
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
  ], [])

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
        <GooeyNav
          items={STATUSES.map(s => ({ label: s.label }))}
          initialActiveIndex={0}
          particleCount={18}
          particleDistances={[70, 10]}
          particleR={80}
          animationTime={500}
          timeVariance={400}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          onActiveChange={(index) => setStatusFilter(STATUSES[index].value)}
        />
      </div>

      {/* DataTable shadcn */}
      <DataTable
        columns={columns}
        data={rows}
        globalFilter={search}
        onRowClick={(row) => router.push(`/clients/${row.id}`)}
      />
    </div>
  )
}
