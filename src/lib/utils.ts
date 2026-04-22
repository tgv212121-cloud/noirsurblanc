export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatRelative(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`
  return formatDate(date)
}

export function calcEngagementRate(metrics: { likes: number; comments: number; reposts: number; impressions: number }): number {
  if (metrics.impressions === 0) return 0
  return ((metrics.likes + metrics.comments + metrics.reposts) / metrics.impressions) * 100
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Decoupe un texte en alternant texte brut et liens cliquables
// Detecte http(s):// ou www. et retourne un tableau d'elements React-safe
export type LinkifiedPart = { type: 'text'; value: string } | { type: 'link'; href: string; label: string }

const URL_RE = /(\b(?:https?:\/\/|www\.)[^\s<>"']+)/gi

export function linkify(text: string): LinkifiedPart[] {
  if (!text) return []
  const out: LinkifiedPart[] = []
  let lastIndex = 0
  const matches = [...text.matchAll(URL_RE)]
  for (const m of matches) {
    const start = m.index ?? 0
    if (start > lastIndex) out.push({ type: 'text', value: text.slice(lastIndex, start) })
    let url = m[0]
    // retire la ponctuation finale parasite qui ne fait pas partie de l'URL
    let trailing = ''
    while (url.length > 0 && /[.,;:!?)\]]$/.test(url)) {
      trailing = url.slice(-1) + trailing
      url = url.slice(0, -1)
    }
    const href = url.startsWith('www.') ? 'https://' + url : url
    out.push({ type: 'link', href, label: url })
    if (trailing) out.push({ type: 'text', value: trailing })
    lastIndex = start + m[0].length
  }
  if (lastIndex < text.length) out.push({ type: 'text', value: text.slice(lastIndex) })
  return out
}

export const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

export function formatMessageTime(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const sameDay = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Aujourd'hui à ${time}`
  if (isYesterday) return `Hier à ${time}`
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 7) {
    return `${DAYS_FR[d.getDay()]} à ${time}`
  }
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${time}`
}
