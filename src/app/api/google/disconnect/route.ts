import { NextResponse } from 'next/server'
import { disconnectPrimary } from '@/lib/google'

export async function POST() {
  try {
    await disconnectPrimary()
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('disconnect', e)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
