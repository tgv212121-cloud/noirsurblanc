'use client'

import { clients } from '@/data/clients'
import { posts } from '@/data/posts'
import { metrics } from '@/data/metrics'
import { reminders } from '@/data/reminders'
import { formatNumber, formatRelative } from '@/lib/utils'
import Link from 'next/link'

export default function Dashboard() {
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

  return (
    <div>
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-blanc">Dashboard</h1>
        <p className="text-sm text-blanc-muted mt-1">Vue d&apos;ensemble de l&apos;activité</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <StatCard label="Clients actifs" value={activeClients.toString()} />
        <StatCard label="Posts ce mois" value={publishedThisMonth.toString()} />
        <StatCard label="Impressions" value={formatNumber(totalImpressions)} />
        <StatCard label="Engagement moyen" value={`${avgEngagement}%`} accent />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Top posts */}
        <div className="bg-noir-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-blanc">Top posts du mois</h2>
            <Link href="/analytics" className="text-sm text-gold hover:text-gold-dark transition-colors duration-200">
              Tout voir →
            </Link>
          </div>
          <div>
            {topPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/clients/${post.clientId}`}
                className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 hover:bg-noir-elevated transition-colors duration-200"
              >
                <span className="w-7 h-7 rounded-full bg-noir-elevated text-blanc-muted text-xs font-medium flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blanc truncate">{post.content.split('\n')[0]}</p>
                  <p className="text-xs text-blanc-muted mt-0.5">{post.client?.name} · {formatRelative(post.publishedAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-blanc">{formatNumber(post.metrics!.impressions)}</p>
                  <p className="text-xs text-gold">{post.metrics!.engagementRate}%</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Pending reminders */}
          <div className="bg-noir-card border border-border rounded-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-blanc">En attente de réponse</h2>
            </div>
            <div>
              {pendingReminders.length === 0 ? (
                <p className="px-5 py-6 text-sm text-blanc-muted">Tous les clients ont répondu ✓</p>
              ) : (
                pendingReminders.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 text-xs font-medium flex items-center justify-center shrink-0">
                      {r.client?.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blanc">{r.client?.name}</p>
                      <p className="text-xs text-blanc-muted">Envoyé {r.lastSentAt ? formatRelative(r.lastSentAt) : '—'}</p>
                    </div>
                    <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-medium rounded">En attente</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Onboarding */}
          {clients.filter(c => c.status === 'onboarding').length > 0 && (
            <div className="bg-noir-card border border-border rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-blanc">Onboarding en cours</h2>
              </div>
              <div>
                {clients.filter(c => c.status === 'onboarding').map(c => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-border last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-gold-muted text-gold text-xs font-medium flex items-center justify-center shrink-0">
                      {c.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blanc">{c.name}</p>
                      <p className="text-xs text-blanc-muted">{c.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-noir-card border border-border rounded-lg px-5 py-5">
      <p className="text-sm text-blanc-muted mb-2">{label}</p>
      <p className={`text-3xl font-bold ${accent ? 'text-gold' : 'text-blanc'}`}>{value}</p>
    </div>
  )
}
