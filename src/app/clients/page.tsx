'use client'

import { useState, useEffect } from 'react'
import { fetchClients, fetchPosts, fetchMetrics } from '@/lib/queries'
import { formatRelative, cn } from '@/lib/utils'
import Link from 'next/link'
import GooeyNav from '@/components/ui/GooeyNavComponent'
import PulseButton from '@/components/ui/PulseButton'
import type { Client, Post, PostMetrics, ClientStatus } from '@/types'

const STATUSES: { value: ClientStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'paused', label: 'En pause' },
]

export default function ClientsPage() {
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

  const filtered = clients.filter(c => {
    const matchesSearch = search === '' ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-blanc">Clients</h1>
          <p className="text-sm text-blanc-muted mt-1">{filtered.length} clients</p>
        </div>
        <Link href="/onboarding">
          <PulseButton>+ Nouveau client</PulseButton>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-5 mb-6">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client..."
          className="bg-noir-card border border-border rounded-lg px-4 py-2.5 text-sm text-blanc placeholder:text-blanc-muted/50 focus:border-gold focus:ring-1 focus:ring-gold/20 transition-all duration-200 w-72 outline-none"
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

      {/* Table */}
      <div className="bg-noir-card border border-border rounded-lg overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1.5fr_100px_100px_100px_100px] gap-4 px-5 py-3 border-b border-border bg-noir-light">
          <span className="text-xs font-medium text-blanc-muted uppercase tracking-wider">Client</span>
          <span className="text-xs font-medium text-blanc-muted uppercase tracking-wider">Entreprise</span>
          <span className="text-xs font-medium text-blanc-muted uppercase tracking-wider">Statut</span>
          <span className="text-xs font-medium text-blanc-muted uppercase tracking-wider">Posts</span>
          <span className="text-xs font-medium text-blanc-muted uppercase tracking-wider">Engagement</span>
          <span className="text-xs font-medium text-blanc-muted uppercase tracking-wider">Dernier post</span>
        </div>

        {/* Rows */}
        {filtered.map(client => {
          const clientPosts = posts.filter(p => p.clientId === client.id && p.status === 'published')
          const clientMetrics = clientPosts.map(p => metrics.find(m => m.postId === p.id)).filter(Boolean)
          const avgEngagement = clientMetrics.length > 0
            ? (clientMetrics.reduce((s, m) => s + m!.engagementRate, 0) / clientMetrics.length).toFixed(1)
            : '—'
          const lastPost = [...clientPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0]

          const statusConfig: Record<string, { label: string; cls: string }> = {
            active: { label: 'Actif', cls: 'bg-emerald-50 text-emerald-600' },
            onboarding: { label: 'Onboarding', cls: 'bg-blue-50 text-blue-600' },
            paused: { label: 'En pause', cls: 'bg-gray-100 text-gray-500' },
          }
          const status = statusConfig[client.status]

          return (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="grid grid-cols-[2fr_1.5fr_100px_100px_100px_100px] gap-4 px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-gold-muted transition-colors duration-150 items-center"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gold-muted text-gold text-xs font-medium flex items-center justify-center shrink-0">
                  {client.avatar}
                </div>
                <span className="text-sm font-medium text-blanc truncate">{client.name}</span>
              </div>
              <span className="text-sm text-blanc-muted truncate">{client.company}</span>
              <span className={cn('text-xs font-medium px-2 py-1 rounded inline-block w-fit', status.cls)}>
                {status.label}
              </span>
              <span className="text-sm text-blanc">{clientPosts.length}</span>
              <span className="text-sm text-gold font-medium">{avgEngagement !== '—' ? `${avgEngagement}%` : '—'}</span>
              <span className="text-sm text-blanc-muted">{lastPost ? formatRelative(lastPost.publishedAt) : '—'}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
