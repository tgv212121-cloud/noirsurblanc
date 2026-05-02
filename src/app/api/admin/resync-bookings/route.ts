import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'
import { createCalendarEvent, createEventForUser, getPrimaryToken } from '@/lib/google'

// Endpoint admin : rejoue la creation d'events Google pour tous les RDV confirmes
// dont google_event_id est null. Utile quand le token a expire silencieusement
// et que les events n'ont pas ete crees.
//
// Usage : POST /api/admin/resync-bookings
// Renvoie un rapport detaille (nombre traite, succes, erreurs).
export async function POST() {
  try {
    const sb = getAdminSupabase()

    const adminToken = await getPrimaryToken()
    if (!adminToken) {
      return NextResponse.json({
        ok: false,
        reason: 'No admin Google token. Connect Google in /settings.',
      }, { status: 400 })
    }

    const nowIso = new Date().toISOString()
    const { data: appointments } = await sb
      .from('appointments')
      .select('*')
      .eq('status', 'confirmed')
      .is('google_event_id', null)
      .gte('scheduled_at', nowIso)

    const list = (appointments || []) as Array<{
      id: string; client_id: string | null; scheduled_at: string;
      duration_min: number; topic: string | null; notes: string | null;
      prospect_name: string | null; prospect_email: string | null; prospect_company: string | null;
    }>

    const results: { id: string; ok: boolean; reason?: string; google_event_id?: string }[] = []

    for (const apt of list) {
      try {
        let recipientEmail: string | null = null
        let recipientName: string | null = null
        let isProspect = false

        if (apt.client_id) {
          const { data: client } = await sb.from('clients').select('email,name').eq('id', apt.client_id).maybeSingle()
          recipientEmail = (client as { email?: string } | null)?.email || null
          recipientName = (client as { name?: string } | null)?.name || null
        } else if (apt.prospect_email) {
          recipientEmail = apt.prospect_email
          recipientName = apt.prospect_name
          isProspect = true
        }

        const endIso = new Date(new Date(apt.scheduled_at).getTime() + (apt.duration_min || 30) * 60_000).toISOString()
        const title = `${recipientName || 'Client'}${isProspect ? ' (prospect)' : ''} - Noirsurblanc`
        const description = [
          apt.topic ? `Sujet : ${apt.topic}` : null,
          apt.notes ? `Notes :\n${apt.notes}` : null,
        ].filter(Boolean).join('\n\n')

        const evt = await createCalendarEvent({
          title,
          description,
          startIso: apt.scheduled_at,
          endIso,
          attendeeEmail: recipientEmail || undefined,
        })
        if (!evt?.id) {
          results.push({ id: apt.id, ok: false, reason: 'createCalendarEvent returned null' })
          continue
        }

        const update: Record<string, unknown> = { google_event_id: evt.id }
        if (evt.hangoutLink) update.meeting_url = evt.hangoutLink
        await sb.from('appointments').update(update).eq('id', apt.id)

        // Duplique sur l'agenda perso du client si Google connecte
        if (apt.client_id) {
          try {
            const { data: prof } = await sb.from('profiles').select('id').eq('client_id', apt.client_id).maybeSingle()
            const clientUserId = (prof as { id?: string } | null)?.id
            if (clientUserId) {
              const clientEvt = await createEventForUser(clientUserId, {
                title: `Rendez-vous Noirsurblanc${apt.topic ? ' — ' + apt.topic : ''}`,
                description,
                startIso: apt.scheduled_at,
                endIso,
                meetingUrl: evt.hangoutLink || undefined,
              })
              if (clientEvt?.id) {
                await sb.from('appointments').update({ client_google_event_id: clientEvt.id }).eq('id', apt.id)
              }
            }
          } catch (e) { console.error('client event resync', e) }
        }

        results.push({ id: apt.id, ok: true, google_event_id: evt.id })
      } catch (e) {
        results.push({ id: apt.id, ok: false, reason: (e as Error).message })
      }
    }

    return NextResponse.json({
      ok: true,
      processed: list.length,
      successes: results.filter(r => r.ok).length,
      failures: results.filter(r => !r.ok).length,
      results,
    })
  } catch (e) {
    console.error('resync-bookings', e)
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
