'use client'

import { supabase } from './supabase'

// Client-side helpers to register service worker + subscribe to push

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

export type PushState = 'unsupported' | 'denied' | 'granted' | 'default'

export function getSupportState(): PushState {
  if (typeof window === 'undefined') return 'unsupported'
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission as PushState
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration('/')
    if (existing) return existing
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  } catch (e) { console.error('SW register failed', e); return null }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapid) { console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY missing'); return false }

  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return false

  const reg = await ensureServiceWorker()
  if (!reg) return false

  try {
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
      })
    }

    const json = sub.toJSON() as { endpoint: string; keys?: { p256dh?: string; auth?: string } }
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) { console.warn('no auth token'); return false }
    const res = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
        userAgent: navigator.userAgent,
      }),
    })
    return res.ok
  } catch (e) {
    console.error('push subscribe failed', e)
    return false
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration('/')
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    return true
  } catch (e) { console.error('unsubscribe failed', e); return false }
}

export async function isSubscribed(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  const reg = await navigator.serviceWorker.getRegistration('/')
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}
