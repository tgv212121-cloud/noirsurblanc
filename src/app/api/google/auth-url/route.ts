import { NextResponse } from 'next/server'
import { buildAuthUrl } from '@/lib/google'

export async function GET(req: Request) {
  try {
    const origin = new URL(req.url).origin
    const url = buildAuthUrl(origin)
    return NextResponse.json({ url })
  } catch (e) {
    console.error('auth-url', e)
    return NextResponse.json({ error: 'server' }, { status: 500 })
  }
}
