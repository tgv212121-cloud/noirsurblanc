'use client'

import { useState, useEffect } from 'react'
import { fetchClients, fetchPosts, fetchMetrics, fetchReminders } from '@/lib/queries'
import { formatNumber, formatRelative } from '@/lib/utils'
import Link from 'next/link'
import type { Client, Post, PostMetrics, Reminder } from '@/types'
import { useAuthGuard } from '@/lib/useAuthGuard'

export default function Dashboard() {
  const { checking } = useAuthGuard({ requireRole: 'admin' })
  const [clients, setClients] = useState<Client[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics[]>([])
  const [reminders, setReminders] = useState<Reminder[]>([])

  useEffect(() => {
    Promise.all([fetchClients(), fetchPosts(), fetchMetrics(), fetchReminders()]).then(([c, p, m, r]) => {
      setClients(c); setPosts(p); setMetrics(m); setReminders(r)
    })
  }, [])

  const activeClients = clients.filter(c => c.status === 'active').length
  const publishedThisMonth = posts.filter(p => p.status === 'published' && p.publishedAt >= '2026-04-01').length
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0)
  const avgEngagement = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + m.engagementRate, 0) / metrics.length).toFixed(2)
    : '0'

  const topPosts = [...posts]
    .filter(p => p.status === 'published')
    .map(p => {
      const m = metrics.find(mt => mt.postId === p.id)
      const client = clients.find(c => c.id === p.clientId)
      return { ...p, metrics: m, client }
    })
    .filter(p => p.metrics)
    .sort((a, b) => (b.metrics!.impressions * b.metrics!.engagementRate) - (a.metrics!.impressions * a.metrics!.engagementRate))
    .slice(0, 5)

  const pendingReminders = reminders
    .filter(r => r.status === 'sent')
    .map(r => ({ ...r, client: clients.find(c => c.id === r.clientId) }))

  if (checking) return <p className="text-sm text-blanc-muted text-center py-20">Chargement...</p>

  const cardBase = 'relative rounded-2xl overflow-hidden'
  const cardStyle = { background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.09)' } as const

  return (
    <div>
      {/* Page title */}
      <div className="flex items-end justify-between" style={{ marginBottom: '36px' }}>
        <div>
          <h1 className="font-heading text-4xl font-medium text-blanc italic leading-none" style={{ marginBottom: '10px' }}>Dashboard</h1>
          <p className="text-sm text-blanc-muted/70">Vue d&apos;ensemble de l&apos;activité</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5" style={{ marginBottom: '40px' }}>
        <StatCard label="Clients actifs" value={activeClients.toString()} />
        <StatCard label="Posts ce mois" value={publishedThisMonth.toString()} />
        <StatCard label="Impressions" value={formatNumber(totalImpressions)} />
        <StatCard label="Engagement moyen" value={`${avgEngagement}%`} accent />
      </div>

      <div>
        {/* Top posts */}
        <div className={cardBase} style={cardStyle}>
          <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
          <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3">
              <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
              <h2 className="font-heading text-lg text-blanc italic">Top posts du mois</h2>
            </div>
            <Link href="/analytics" className="text-xs tracking-[0.14em] uppercase text-gold hover:text-gold-light transition-colors duration-200">
              Tout voir →
            </Link>
          </div>
          <div>
            {topPosts.length === 0 ? (
              <p className="text-sm text-blanc-muted/60 text-center" style={{ padding: '40px 24px' }}>Aucun post publié ce mois-ci.</p>
            ) : topPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/clients/${post.clientId}`}
                className="flex items-center gap-4 hover:bg-white/[0.025] transition-colors duration-200 group"
                style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <span className="flex items-center justify-center shrink-0 font-heading italic" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(202,138,4,0.12)', border: '1px solid rgba(202,138,4,0.3)', color: '#ca8a04', fontSize: '13px' }}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blanc truncate group-hover:text-gold transition-colors">{post.content.split('\n')[0]}</p>
                  <p className="text-xs text-blanc-muted/70" style={{ marginTop: '4px' }}>{post.client?.name} · {formatRelative(post.publishedAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-blanc">{formatNumber(post.metrics!.impressions)}</p>
                  <p className="text-xs text-gold" style={{ marginTop: '2px' }}>{post.metrics!.engagementRate}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: accent
          ? 'linear-gradient(135deg, rgba(202,138,4,0.08), rgba(202,138,4,0.02))'
          : 'rgba(255,255,255,0.025)',
        border: `1px solid ${accent ? 'rgba(202,138,4,0.25)' : 'rgba(255,255,255,0.09)'}`,
        padding: '22px 24px',
      }}
    >
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />
      <p className="text-[11px] text-blanc-muted/60 uppercase tracking-[0.16em]" style={{ marginBottom: '14px' }}>{label}</p>
      <p className={`font-heading font-medium leading-none ${accent ? 'text-gold italic' : 'text-blanc'}`} style={{ fontSize: '40px' }}>{value}</p>
    </div>
  )
}
