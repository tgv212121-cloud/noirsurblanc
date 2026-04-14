'use client'

import { useState, useEffect } from 'react'
import { fetchClients, fetchPosts, fetchMetrics } from '@/lib/queries'
import { formatNumber, cn } from '@/lib/utils'
import type { Client, Post, PostMetrics } from '@/types'
import GooeyNav from '@/components/ui/GooeyNavComponent'
import PulseButton from '@/components/ui/PulseButton'
import Link from 'next/link'
import { motion } from 'framer-motion'
import WordReveal from '@/components/animations/WordReveal'
import Counter, { CounterFormatted } from '@/components/animations/Counter'
import { ClipReveal } from '@/components/animations/RevealSection'

const EASE_SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1]

type Period = '7d' | '30d' | 'all'

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d')
  const [csvData, setCsvData] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [metrics, setMetrics] = useState<PostMetrics[]>([])

  useEffect(() => {
    Promise.all([fetchClients(), fetchPosts(), fetchMetrics()]).then(([c, p, m]) => {
      setClients(c); setPosts(p); setMetrics(m)
    })
  }, [])

  const cutoff = period === '7d'
    ? new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
    : period === '30d'
    ? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
    : '2000-01-01'

  const filteredMetrics = metrics.filter(m => m.capturedAt >= cutoff)
  const filteredPosts = posts
    .filter(p => p.status === 'published')
    .map(p => {
      const m = filteredMetrics.find(mt => mt.postId === p.id)
      const client = clients.find(c => c.id === p.clientId)
      return { ...p, metrics: m, client }
    })
    .filter(p => p.metrics)
    .sort((a, b) => b.metrics!.impressions - a.metrics!.impressions)

  const totalImpressions = filteredMetrics.reduce((s, m) => s + m.impressions, 0)
  const totalLikes = filteredMetrics.reduce((s, m) => s + m.likes, 0)
  const totalComments = filteredMetrics.reduce((s, m) => s + m.comments, 0)
  const avgEngagement = filteredMetrics.length > 0
    ? (filteredMetrics.reduce((s, m) => s + m.engagementRate, 0) / filteredMetrics.length).toFixed(2)
    : '0'

  const clientStats = clients
    .filter(c => c.status === 'active')
    .map(c => {
      const cPosts = posts.filter(p => p.clientId === c.id && p.status === 'published')
      const cMetrics = cPosts.map(p => filteredMetrics.find(m => m.postId === p.id)).filter(Boolean)
      const totalImp = cMetrics.reduce((s, m) => s + m!.impressions, 0)
      const avgEng = cMetrics.length > 0
        ? cMetrics.reduce((s, m) => s + m!.engagementRate, 0) / cMetrics.length
        : 0
      return { ...c, totalImpressions: totalImp, avgEngagement: avgEng, postCount: cPosts.length }
    })
    .sort((a, b) => b.totalImpressions - a.totalImpressions)

  const chartData = filteredPosts.slice(0, 12)
  const maxImpressions = Math.max(...chartData.map(p => p.metrics!.impressions), 1)

  return (
    <div className="py-12">
      <header className="mb-12">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-blanc-muted text-xs tracking-[0.2em] uppercase font-body mb-3"
        >
          Analytics
        </motion.p>
        <div className="overflow-hidden">
          <WordReveal className="font-heading text-5xl font-bold tracking-[-0.04em] leading-[0.9] text-blanc" delay={0.2}>
            Performance
          </WordReveal>
        </div>
        <div className="overflow-hidden">
          <WordReveal className="font-heading text-4xl font-bold tracking-[-0.04em] leading-[0.9] text-gold italic" delay={0.35}>
            globale
          </WordReveal>
        </div>
      </header>

      <div className="flex items-center justify-between mb-10">
        <GooeyNav
          items={[{ label: '7 jours' }, { label: '30 jours' }, { label: 'Tout' }]}
          initialActiveIndex={1}
          particleCount={18}
          particleDistances={[70, 10]}
          particleR={80}
          animationTime={500}
          timeVariance={400}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          onActiveChange={(index) => {
            const periods: Period[] = ['7d', '30d', 'all']
            setPeriod(periods[index])
          }}
        />
        <button
          onClick={() => setShowImport(!showImport)}
          className="text-xs text-blanc-muted hover:text-gold border border-blanc/[0.08] px-3 py-1.5 transition-colors duration-300 cursor-pointer"
        >
          Import CSV
        </button>
      </div>

      {showImport && (
        <div className="mb-10 border border-blanc/[0.08] bg-noir-card p-6">
          <p className="text-xs text-blanc-muted uppercase tracking-[0.15em] mb-2">Import CSV de métriques</p>
          <p className="text-[10px] text-blanc-muted mb-4">Format : postId, impressions, likes, comments, reposts</p>
          <textarea
            value={csvData}
            onChange={e => setCsvData(e.target.value)}
            placeholder="p-01, 18420, 347, 89, 42"
            rows={5}
            className="w-full bg-noir border border-blanc/[0.08] px-4 py-3 text-sm text-blanc font-mono placeholder:text-blanc-muted/50 focus:border-gold/40 transition-all duration-300 resize-none outline-none"
          />
          <div className="flex gap-2 mt-3">
            <PulseButton>Importer</PulseButton>
            <button onClick={() => setShowImport(false)} className="px-4 py-2 text-xs text-blanc-muted cursor-pointer">Annuler</button>
          </div>
        </div>
      )}

      <ClipReveal delay={0.5} direction="left">
        <section className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16 border-t border-b border-blanc/[0.06] py-8">
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Impressions</p>
            <CounterFormatted target={totalImpressions} className="font-heading text-2xl font-bold text-blanc" delay={600} />
          </div>
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Likes</p>
            <CounterFormatted target={totalLikes} className="font-heading text-2xl font-bold text-blanc" delay={700} />
          </div>
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Commentaires</p>
            <CounterFormatted target={totalComments} className="font-heading text-2xl font-bold text-blanc" delay={800} />
          </div>
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Engagement</p>
            <Counter target={parseFloat(avgEngagement)} decimals={2} suffix="%" className="font-heading text-2xl font-bold text-gold" delay={900} />
          </div>
          <div>
            <p className="text-[10px] text-blanc-muted uppercase tracking-[0.15em] mb-2">Posts</p>
            <Counter target={filteredMetrics.length} className="font-heading text-2xl font-bold text-blanc" delay={1000} />
          </div>
        </section>
      </ClipReveal>

      <motion.section
        className="mb-20"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE_SPRING, delay: 1 }}
      >
        <h2 className="font-heading text-xl italic text-blanc mb-8">Impressions par post</h2>
        <div className="flex items-end gap-2 h-[200px] border-b border-blanc/[0.06] pb-2">
          {chartData.map(post => {
            const height = (post.metrics!.impressions / maxImpressions) * 100
            return (
              <div key={post.id} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                <span className="text-[9px] text-blanc-muted opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {formatNumber(post.metrics!.impressions)}
                </span>
                <div
                  className="w-full bg-gold/20 hover:bg-gold/40 transition-colors duration-300 min-h-[2px]"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[8px] text-blanc-muted truncate max-w-full mt-1">
                  {post.client?.name?.split(' ')[0]}
                </span>
              </div>
            )
          })}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <section>
          <h2 className="font-heading text-xl italic text-blanc mb-8">Classement des posts</h2>
          <div className="border-t border-blanc/[0.06]">
            {filteredPosts.slice(0, 10).map((post, i) => (
              <Link
                key={post.id}
                href={`/clients/${post.clientId}`}
                className="group flex items-start gap-4 py-5 border-b border-blanc/[0.04] hover:bg-gold-muted transition-colors duration-300 -mx-2 px-2"
              >
                <span className="font-heading text-lg font-bold text-blanc/[0.08] w-6 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gold mb-1">{post.client?.name}</p>
                  <p className="text-sm text-blanc/60 font-light line-clamp-1 group-hover:text-blanc/80 transition-colors duration-300">
                    {post.content.split('\n')[0]}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-[10px] text-blanc-muted">{formatNumber(post.metrics!.impressions)} imp</span>
                    <span className="text-[10px] text-gold">{post.metrics!.engagementRate}% eng</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading text-xl italic text-blanc mb-8">Par client</h2>
          <div className="border-t border-blanc/[0.06]">
            {clientStats.map((c, i) => (
              <Link
                key={c.id}
                href={`/clients/${c.id}`}
                className="flex items-center gap-4 py-4 border-b border-blanc/[0.04] hover:bg-gold-muted transition-colors duration-300 -mx-2 px-2"
              >
                <span className="font-heading text-lg font-bold text-blanc/[0.08] w-6 shrink-0">{i + 1}</span>
                <div className="w-7 h-7 border border-gold/20 bg-gold-muted flex items-center justify-center text-[9px] font-body text-gold shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-blanc/70 truncate">{c.name}</p>
                  <p className="text-[10px] text-blanc-muted">{c.postCount} posts</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blanc/60">{formatNumber(c.totalImpressions)}</p>
                  <p className="text-[10px] text-gold">{c.avgEngagement.toFixed(2)}%</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
