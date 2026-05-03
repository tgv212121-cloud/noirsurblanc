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
  parsed_datetime?: string
  share_url?: string
  url?: string
  permalink?: string
  reaction_counter?: number
  comment_counter?: number
  repost_counter?: number
  view_counter?: number
  impression_count?: number
  imppressions_counter?: number  // typo officielle Unipile (sic)
  impressions_counter?: number   // au cas ou ils corrigent
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

    // Etape 1 : recupere mon profil LinkedIn (pour avoir mon provider_id LinkedIn)
    const meRes = await fetch(`${UNIPILE_DSN}/api/v1/users/me?account_id=${encodeURIComponent(accountId)}`, {
      method: 'GET',
      headers: { 'X-API-KEY': UNIPILE_API_KEY, accept: 'application/json' },
    })
    const meTxt = await meRes.text()
    if (!meRes.ok) {
      console.error('[unipile sync] /users/me failed', meRes.status, meTxt)
      return NextResponse.json({ error: 'Unipile /users/me failed', status: meRes.status, detail: meTxt.slice(0, 500) }, { status: 500 })
    }
    let me: { provider_id?: string; public_identifier?: string; id?: string } = {}
    try { me = JSON.parse(meTxt) } catch {}
    const myId = me.provider_id || me.public_identifier || me.id
    if (!myId) {
      return NextResponse.json({ error: 'No provider_id in Unipile /users/me response', detail: meTxt.slice(0, 500) }, { status: 500 })
    }

    // Etape 2 : recupere mes posts via /users/{provider_id}/posts
    const r = await fetch(`${UNIPILE_DSN}/api/v1/users/${encodeURIComponent(myId)}/posts?account_id=${encodeURIComponent(accountId)}&limit=100`, {
      method: 'GET',
      headers: { 'X-API-KEY': UNIPILE_API_KEY, accept: 'application/json' },
    })
    const txt = await r.text()
    if (!r.ok) {
      console.error('[unipile sync] fetch posts failed', r.status, txt)
      return NextResponse.json({ error: 'Unipile posts fetch failed', status: r.status, detail: txt.slice(0, 500) }, { status: 500 })
    }
    let parsed: any = {}
    try { parsed = JSON.parse(txt) } catch {}
    // Unipile peut renvoyer plusieurs shapes : { items: [...] }, { data: [...] }, { posts: [...] } ou directement un array
    const items: UnipilePost[] = (
      parsed.items
      || parsed.data
      || parsed.posts
      || parsed.results
      || (Array.isArray(parsed) ? parsed : [])
    ) as UnipilePost[]

    // Si toujours 0, on log les keys du response pour diagnostic
    if (items.length === 0) {
      const responseKeys = Object.keys(parsed || {})
      const sampleKeys = parsed && Array.isArray(parsed.items) === false && typeof parsed === 'object'
        ? JSON.stringify(parsed).slice(0, 800)
        : 'array_or_unknown'
      return NextResponse.json({
        ok: true,
        accountId,
        myProviderId: myId,
        postsFromUnipile: 0,
        postsUpserted: 0,
        metricsUpserted: 0,
        debug: {
          response_keys: responseKeys,
          response_sample: sampleKeys,
          raw_response_preview: txt.slice(0, 1000),
        },
      })
    }

    let postsUpserted = 0
    let metricsUpserted = 0
    let firstError: string | null = null

    for (const p of items) {
      const externalId = p.social_id || p.provider_id || p.id
      const shareUrl = p.share_url || p.url || p.permalink || null
      // On utilise une "cle de match" (la meilleure URL ou ID dispo) qu'on stocke dans linkedin_url
      const matchKey = shareUrl || externalId
      const content = p.text || p.body || ''
      const publishedAt = p.parsed_datetime || p.date || p.created_at || p.published_at || new Date().toISOString()
      if (!externalId || !matchKey) continue

      // Match : on cherche un post existant pour ce client avec linkedin_url = matchKey
      const { data: existing } = await sb
        .from('posts')
        .select('id')
        .eq('client_id', clientId)
        .eq('linkedin_url', matchKey)
        .maybeSingle()

      let postId: string
      if (existing && (existing as { id: string }).id) {
        // Post deja sync : on met juste a jour status + content + date
        postId = (existing as { id: string }).id
        await sb.from('posts').update({
          status: 'published',
          content,
          published_at: publishedAt,
        }).eq('id', postId)
      } else {
        // Premier sync : on genere un UUID cote serveur (la colonne posts.id est NOT NULL sans default)
        const newId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
        const { error: insErrPost } = await sb.from('posts').insert({
          id: newId,
          client_id: clientId,
          content,
          published_at: publishedAt,
          status: 'published',
          linkedin_url: matchKey,
        })
        if (insErrPost) {
          if (!firstError) firstError = `posts insert: ${insErrPost.message}`
          console.error('[unipile sync] posts insert failed', insErrPost)
          continue
        }
        postId = newId
        postsUpserted++
      }

      // Metrics upsert avec mapping ouvert sur les noms de champs Unipile (qui ont un typo "imppressions")
      const eng = p.engagement || {}
      const impressions = p.imppressions_counter ?? p.impressions_counter ?? p.view_counter ?? p.impression_count ?? eng.views ?? eng.impressions ?? 0
      const likes = p.reaction_counter ?? eng.likes ?? 0
      const comments = p.comment_counter ?? eng.comments ?? 0
      const reposts = p.repost_counter ?? eng.reposts ?? 0
      const engagementRate = impressions > 0 ? ((likes + comments + reposts) / impressions) * 100 : 0

      // Upsert : on essaie d'abord avec engagement_rate, sinon on retente sans (au cas ou la colonne s'appelle autrement)
      await sb.from('metrics').delete().eq('post_id', postId)
      const { error: insErr } = await sb.from('metrics').insert({
        post_id: postId,
        impressions,
        likes,
        comments,
        reposts,
        engagement_rate: engagementRate,
        captured_at: new Date().toISOString(),
      })
      if (!insErr) {
        metricsUpserted++
      } else if (!firstError) {
        firstError = insErr.message || JSON.stringify(insErr)
        console.error('[unipile sync] metrics insert error', insErr)
      }
    }

    return NextResponse.json({
      ok: true,
      accountId,
      postsFromUnipile: items.length,
      postsUpserted,
      metricsUpserted,
      firstError,
      sample: items[0] || null,
    })
  } catch (e) {
    console.error('[unipile sync]', e)
    return NextResponse.json({ error: (e as Error).message || 'Server error' }, { status: 500 })
  }
}
