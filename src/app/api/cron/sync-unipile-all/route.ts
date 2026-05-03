import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://noirsurblanc.vercel.app'

// Cron Vercel : appele 1 fois par jour (config dans vercel.json)
// Iterate sur tous les profils ayant un unipile_account_id et declenche un sync.
// Securise par CRON_SECRET (header Authorization).
export async function GET(req: Request) {
  // Verif simple : Vercel cron envoie un header Authorization avec le CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const sb = getAdminSupabase()
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, unipile_account_id')
      .not('unipile_account_id', 'is', null)

    const targets = (profiles || []) as Array<{ id: string; unipile_account_id: string }>
    const results: Array<{ userId: string; ok: boolean; reason?: string; postsUpserted?: number; metricsUpserted?: number }> = []

    for (const t of targets) {
      try {
        const r = await fetch(`${APP_URL}/api/unipile/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: t.id }),
        })
        const d = await r.json()
        results.push({
          userId: t.id,
          ok: !!d.ok,
          postsUpserted: d.postsUpserted,
          metricsUpserted: d.metricsUpserted,
          reason: d.error || d.firstError,
        })
      } catch (e) {
        results.push({ userId: t.id, ok: false, reason: (e as Error).message })
      }
    }

    return NextResponse.json({
      ok: true,
      ranAt: new Date().toISOString(),
      total: targets.length,
      results,
    })
  } catch (e) {
    console.error('[cron sync-unipile-all]', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
