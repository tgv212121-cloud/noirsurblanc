import { NextResponse } from 'next/server'
import { getBusySlots } from '@/lib/google'

export async function POST(req: Request) {
  try {
    const { timeMin, timeMax } = await req.json()
    if (!timeMin || !timeMax) return NextResponse.json({ busy: [] })
    const busy = await getBusySlots(timeMin, timeMax)
    return NextResponse.json({ busy })
  } catch (e) {
    console.error('freebusy', e)
    return NextResponse.json({ busy: [] })
  }
}
