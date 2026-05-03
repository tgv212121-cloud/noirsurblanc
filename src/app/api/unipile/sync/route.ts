import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const UNIPILE_API_KEY = process.env.UNIPILE_API_KEY
const UNIPILE_DSN = process.env.UNIPILE_DSN

// POST /api/unipile/sync { userId }
// Recupere les posts LinkedIn du compte connecte via Unipile,
// puis upsert posts + metrics dans la DB.
//
// Retour: { ok, accountId, postsFromUnipile, postsUpserted, metricsUpserted, sample? }

type UnipilePost = {
  id?: string
  provider_id?: string
  social_id?: string
  text?: string
  body?: string
  date?: string
  created_at?: string
  published_at?: string
  share_url?: string
  url?: string
  permalink?: string
  reaction_counter?: number
  comment_counter?: number
  repost_counter?: number
  view_counter?: number
  impression_count?: number
  engagement?: {
    likes?: number
    comments?: number
    reposts?: number
    views?: number
    impressions?: number
  }
}

export async function POST(req: Request) {
  try {
    if (!UNIPILE_API_KEY || !UNIPILE_DSN) {
      return NextResponse.json({ error: 'Unipile not configured' }, { status: 500 })
    }
    const { userId } = await req.json()
    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

    const sb = getAdminSupabase()
    const { data: prof } = await sb.from('profiles').select('unipile_account_id, client_id').eq('id', userId).maybeSingle()
    const accountId = (prof as { unipile_account_id?: string } | null)?.unipile_account_id
    const clientId = (prof as { client_id?: string } | null)?.client_id
    if (!accountId) return NextResponse.json({ error: 'No Unipile account linked' }, { status: 400 })
    if (!clientId) return NextResponse.json({ error: 'Profile has no client_id' }, { status: 400 })

    // Fetch the posts of this account on LinkedIn via Unipile
    const r = await fetch(`${UNIPILE_DSN}/api/v1/users/me/posts?account_id=${encodeURIComponent(accountId)}&limit=100`, {
      method: 'GET',
      headers: {
        'X-API-KEY': UNIPILE_API_KEY,
        accept: 'application/json',
      },
    })
    const txt = await r.text()
    if (!r.ok) {
      console.error('[unipile sync] fetch posts failed', r.status, txt)
      return NextResponse.json({ error: 'Unipile fetch failed', status: r.status, detail: txt.slice(0, 500) }, { status: 500 })
    }
    let parsed: { items?: UnipilePost[]; data?: UnipilePost[] } = {}
    try { parsed = JSON.parse(txt) } catch {}
    const items: UnipilePost[] = parsed.items || parsed.data || []

    let postsUpserted = 0
    let metricsUpserted = 0

    for (const p of items) {
      const externalId = p.social_id || p.provider_id || p.id
      const linkedinUrl = p.share_url || p.url || p.permalink || null
      const content = p.text || p.body || ''
      const publishedAt = p.date || p.created_at || p.published_at || new Date().toISOString()
      if (!externalId) continue

      // Match : on cherche un post existant avec ce linkedin_url ou cet id externe (stocke dans linkedin_url)
      const candidateUrl = linkedinUrl || externalId
      const { data: existing } = await sb
        .from('posts')
        .select('id')
        .eq('client_id', clientId)
        .or(`linkedin_url.eq.${candidateUrl},id.eq.${externalId}`)
        .maybeSingle()

      let postId: string
      if (existing && (existing as { id: string }).id) {
        postId = (existing as { id: string }).id
        // Update url si manquant
        if (linkedinUrl) {
          await sb.from('posts').update({ linkedin_url: linkedinUrl, status: 'published' }).eq('id', postId)
        }
      } else {
        // On insere un nouveau post lie a ce client
        postId = externalId
        await sb.from('posts').insert({
          id: postId,
          client_id: clientId,
          content,
          published_at: publishedAt,
          status: 'published',
          linkedin_url: linkedinUrl,
        })
        postsUpserted++
      }

      // Metrics upsert
      const eng = p.engagement || {}
      const impressions = p.view_counter ?? p.impression_count ?? eng.views ?? eng.impressions ?? 0
      const likes = p.reaction_counter ?? eng.likes ?? 0
      const comments = p.comment_counter ?? eng.comments ?? 0
      const reposts = p.repost_counter ?? eng.reposts ?? 0
      const engagement_rate = impressions > 0 ? ((likes + comments + reposts) / impressions) * 100 : 0

      // Upsert (delete existing puis insert pour eviter les conflits si la table n'a pas de unique sur post_id)
      await sb.from('metrics').delete().eq('post_id', postId)
      const { error: insErr } = await sb.from('metrics').insert({
        post_id: postId,
        impressions,
        likes,
        comments,
        reposts,
        engagement_rate,
        captured_at: new Date().toISOString(),
      })
      if (!insErr) metricsUpserted++
    }

    return NextResponse.json({
      ok: true,
      accountId,
      postsFromUnipile: items.length,
      postsUpserted,
      metricsUpserted,
      sample: items[0] || null,
    })
  } catch (e) {
    console.error('[unipile sync]', e)
    return NextResponse.json({ error: (e as Error).message || 'Server error' }, { status: 500 })
  }
}
