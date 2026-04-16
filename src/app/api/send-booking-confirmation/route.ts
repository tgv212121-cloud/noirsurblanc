import { NextResponse } from 'next/server'
import { createClient as createSupabase } from '@supabase/supabase-js'

const FROM = process.env.RESEND_FROM || 'Noirsurblanc <noreply@digitaltimes.fr>'

const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const pad = (n: number) => n.toString().padStart(2, '0')

function buildHtml(firstName: string, date: Date, durationMin: number, topic: string | null, meetingUrl: string) {
  const dateStr = `${DAYS_FR[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]}`
  const timeStr = `${pad(date.getHours())}h${pad(date.getMinutes())}`
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0a0a0a; padding:48px 20px; font-family: Helvetica, Arial, sans-serif;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="560" style="max-width:560px;">
        <tr><td align="center" style="padding-bottom:12px;">
          <div style="font-family: Georgia, 'Times New Roman', serif; font-size:44px; color:#fafaf9; font-weight:normal; line-height:1;">
            Noir<span style="color:#ca8a04; font-style:italic;">sur</span>blanc
          </div>
        </td></tr>
        <tr><td align="center" style="padding-bottom:44px;">
          <div style="color:rgba(255,255,255,0.55); font-size:11px; letter-spacing:3px; text-transform:uppercase;">Confirmation de rendez-vous</div>
        </td></tr>
        <tr><td style="background:#141414; border:1px solid rgba(255,255,255,0.08); border-radius:18px; padding:40px 36px;">
          <p style="color:#fafaf9; font-size:17px; line-height:1.6; margin:0 0 18px;">Salut ${firstName.replace(/[<>]/g,'')},</p>
          <p style="color:rgba(255,255,255,0.78); font-size:15px; line-height:1.7; margin:0 0 28px;">
            Ton rendez-vous est confirmé. À très vite.
          </p>
          <div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:22px; margin-bottom:24px;">
            <p style="color:rgba(255,255,255,0.55); font-size:11px; letter-spacing:2px; text-transform:uppercase; margin:0 0 8px;">${dateStr}</p>
            <p style="color:#fafaf9; font-family: Georgia, serif; font-style:italic; font-size:30px; margin:0 0 6px;">${timeStr}</p>
            <p style="color:rgba(255,255,255,0.65); font-size:14px; margin:0;">${durationMin} minutes${topic ? ' · ' + topic.replace(/[<>]/g,'') : ''}</p>
          </div>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr><td align="center" style="padding:4px 0 8px;">
              <a href="${meetingUrl}" style="display:inline-block; background:#ca8a04; color:#0a0a0a !important; text-decoration:none; padding:16px 36px; border-radius:12px; font-weight:700; font-size:13px; letter-spacing:2px; text-transform:uppercase;">
                Voir les détails
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-top:36px;">
          <div style="color:rgba(255,255,255,0.3); font-size:11px; letter-spacing:2px; text-transform:uppercase;">
            Noirsurblanc, le contenu qui travaille pour toi
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>`
}

export async function POST(req: Request) {
  try {
    const { appointmentId, clientName } = await req.json()
    if (!appointmentId) return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 })

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY absente' }, { status: 500 })

    const supabase = createSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: apt } = await supabase.from('appointments').select('*').eq('id', appointmentId).maybeSingle()
    if (!apt) return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })

    const { data: client } = await supabase.from('clients').select('email,name').eq('id', apt.client_id).maybeSingle()
    const email = client?.email
    if (!email) return NextResponse.json({ error: 'No email for client' }, { status: 400 })

    const firstName = (clientName || client?.name || '').split(' ')[0] || 'Bonjour'
    const date = new Date(apt.scheduled_at)
    const meetingUrl = apt.meeting_url || ''

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: FROM,
        to: email,
        subject: `Rendez-vous confirmé, ${firstName}`,
        html: buildHtml(firstName, date, apt.duration_min, apt.topic, meetingUrl),
      }),
    })
    const data = await r.json()
    if (!r.ok) return NextResponse.json({ error: data?.message || 'Resend error' }, { status: r.status })
    return NextResponse.json({ ok: true, id: data.id })
  } catch (e) {
    console.error('send-booking-confirmation', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
