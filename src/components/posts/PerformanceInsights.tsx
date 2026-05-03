'use client'

import type { Post, PostMetrics } from '@/types'
import { formatNumber } from '@/lib/utils'

type Props = {
  posts: Post[]
  metrics: PostMetrics[]
  clientFirstName?: string
}

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

// Rate moyen de tous les posts pour avoir une baseline
function avgRate(items: { engagementRate: number }[]): number {
  if (items.length === 0) return 0
  return items.reduce((s, x) => s + x.engagementRate, 0) / items.length
}

export default function PerformanceInsights({ posts, metrics, clientFirstName }: Props) {
  // Pair chaque post publie avec ses metrics
  const enriched = posts
    .filter(p => p.status === 'published')
    .map(p => ({ post: p, m: metrics.find(mt => mt.postId === p.id) }))
    .filter((x): x is { post: Post; m: PostMetrics } => !!x.m)

  if (enriched.length < 2) {
    return (
      <div className="rounded-2xl mb-10" style={{ padding: '28px 32px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-sm text-blanc-muted/70">Il faut au moins 2 posts publiés avec des métriques pour générer des insights de performance.</p>
      </div>
    )
  }

  // Score combine = engagement * impressions (recompense la portee + l'interaction)
  const scored = enriched.map(({ post, m }) => ({
    post, m, score: m.impressions * m.engagementRate,
  })).sort((a, b) => b.score - a.score)

  const top3 = scored.slice(0, 3)
  const baselineRate = avgRate(enriched.map(e => e.m))

  // PATTERN 1 : meilleur jour de la semaine
  const byDay: Record<number, { count: number; rate: number }> = {}
  for (const e of enriched) {
    const dow = new Date(e.post.publishedAt).getDay()
    if (!byDay[dow]) byDay[dow] = { count: 0, rate: 0 }
    byDay[dow].count++
    byDay[dow].rate += e.m.engagementRate
  }
  const bestDay = Object.entries(byDay)
    .map(([d, v]) => ({ day: Number(d), count: v.count, avgRate: v.rate / v.count }))
    .filter(x => x.count >= 1)
    .sort((a, b) => b.avgRate - a.avgRate)[0]

  // PATTERN 2 : meilleure longueur (tranches de 250 chars)
  const byLength: { range: string; from: number; to: number; rates: number[] }[] = [
    { range: '< 500 c.', from: 0, to: 500, rates: [] },
    { range: '500-1000 c.', from: 500, to: 1000, rates: [] },
    { range: '1000-1500 c.', from: 1000, to: 1500, rates: [] },
    { range: '> 1500 c.', from: 1500, to: 99999, rates: [] },
  ]
  for (const e of enriched) {
    const len = e.post.content.length
    const bucket = byLength.find(b => len >= b.from && len < b.to)
    if (bucket) bucket.rates.push(e.m.engagementRate)
  }
  const bestLength = byLength
    .filter(b => b.rates.length >= 1)
    .map(b => ({ range: b.range, count: b.rates.length, avg: b.rates.reduce((a, c) => a + c, 0) / b.rates.length }))
    .sort((a, b) => b.avg - a.avg)[0]

  // PATTERN 3 : meilleure plage horaire
  const byHour: Record<string, { count: number; rate: number }> = {
    'Matin (6-12h)': { count: 0, rate: 0 },
    'Midi (12-14h)': { count: 0, rate: 0 },
    'Après-midi (14-18h)': { count: 0, rate: 0 },
    'Soir (18-22h)': { count: 0, rate: 0 },
  }
  for (const e of enriched) {
    const h = new Date(e.post.publishedAt).getHours()
    let key = 'Matin (6-12h)'
    if (h >= 12 && h < 14) key = 'Midi (12-14h)'
    else if (h >= 14 && h < 18) key = 'Après-midi (14-18h)'
    else if (h >= 18 && h < 22) key = 'Soir (18-22h)'
    byHour[key].count++
    byHour[key].rate += e.m.engagementRate
  }
  const bestHour = Object.entries(byHour)
    .map(([range, v]) => ({ range, count: v.count, avgRate: v.count ? v.rate / v.count : 0 }))
    .filter(x => x.count >= 1)
    .sort((a, b) => b.avgRate - a.avgRate)[0]

  const firstName = clientFirstName || 'le client'

  return (
    <div className="mb-10">
      {/* Header */}
      <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
        <span className="inline-block rounded-full" style={{ width: '6px', height: '6px', background: '#ca8a04', boxShadow: '0 0 10px rgba(202,138,4,0.6)' }} />
        <h3 className="font-heading italic text-blanc" style={{ fontSize: '20px' }}>Ce qui marche pour {firstName}</h3>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ marginBottom: '24px', gap: '20px' }}>
        {top3.map((entry, i) => {
          const firstLine = entry.post.content.split('\n').filter(l => l.trim())[0] || ''
          const rateDelta = entry.m.engagementRate - baselineRate
          const isAbove = rateDelta > 0
          return (
            <div key={entry.post.id} className="relative rounded-2xl overflow-hidden" style={{
              padding: '22px 24px',
              background: i === 0 ? 'linear-gradient(135deg, rgba(202,138,4,0.10), rgba(202,138,4,0.02))' : 'rgba(255,255,255,0.025)',
              border: i === 0 ? '1px solid rgba(202,138,4,0.28)' : '1px solid rgba(255,255,255,0.08)',
            }}>
              <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                <span className="font-heading italic" style={{ fontSize: '24px', color: i === 0 ? '#ca8a04' : 'rgba(255,255,255,0.4)' }}>
                  {i === 0 ? '1er' : i === 1 ? '2e' : '3e'}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-blanc-muted/60">Top {i + 1}</span>
              </div>
              <p className="text-sm text-blanc leading-relaxed" style={{ marginBottom: '16px', minHeight: '40px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {firstLine}
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blanc-muted/50" style={{ marginBottom: '2px' }}>Impressions</p>
                  <p className="text-lg text-blanc font-medium">{formatNumber(entry.m.impressions)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-blanc-muted/50" style={{ marginBottom: '2px' }}>Engagement</p>
                  <p className="text-lg font-medium" style={{ color: i === 0 ? '#ca8a04' : '#fafaf9' }}>{entry.m.engagementRate.toFixed(2)}%</p>
                </div>
                {Math.abs(rateDelta) > 0.05 && (
                  <span className="text-[10px] uppercase tracking-wider rounded-full" style={{ padding: '3px 8px', background: isAbove ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isAbove ? '#22c55e' : '#f87171' }}>
                    {isAbove ? '+' : ''}{rateDelta.toFixed(2)} vs moyenne
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Patterns insights */}
      <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '20px' }}>
        {bestDay && (
          <InsightCard
            label="Meilleur jour"
            value={DAYS_FR[bestDay.day]}
            subtitle={`${bestDay.avgRate.toFixed(2)}% engagement moyen sur ${bestDay.count} post${bestDay.count > 1 ? 's' : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
            }
          />
        )}
        {bestLength && (
          <InsightCard
            label="Meilleure longueur"
            value={bestLength.range}
            subtitle={`${bestLength.avg.toFixed(2)}% engagement moyen sur ${bestLength.count} post${bestLength.count > 1 ? 's' : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="12" x2="3" y2="12"/><line x1="13" y1="18" x2="3" y2="18"/></svg>
            }
          />
        )}
        {bestHour && (
          <InsightCard
            label="Meilleure plage horaire"
            value={bestHour.range}
            subtitle={`${bestHour.avgRate.toFixed(2)}% engagement moyen sur ${bestHour.count} post${bestHour.count > 1 ? 's' : ''}`}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            }
          />
        )}
      </div>

      <p className="text-xs text-blanc-muted/50" style={{ marginTop: '16px', lineHeight: 1.6 }}>
        Insights calculés sur {enriched.length} post{enriched.length > 1 ? 's' : ''} publié{enriched.length > 1 ? 's' : ''}. Plus tu publies, plus la signal s&apos;affine. Réplique les patterns gagnants sur tes prochains posts.
      </p>
    </div>
  )
}

function InsightCard({ label, value, subtitle, icon }: { label: string; value: string; subtitle: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl" style={{ padding: '20px 22px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-2" style={{ marginBottom: '10px', color: '#ca8a04' }}>
        {icon}
        <p className="text-[10px] uppercase tracking-[0.18em] text-blanc-muted/70">{label}</p>
      </div>
      <p className="font-heading italic text-blanc" style={{ fontSize: '22px', marginBottom: '4px', lineHeight: 1.2 }}>{value}</p>
      <p className="text-[11px] text-blanc-muted/60 leading-relaxed">{subtitle}</p>
    </div>
  )
}
