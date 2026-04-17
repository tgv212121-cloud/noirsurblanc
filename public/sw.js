// Noirsurblanc - Service Worker for Web Push Notifications
/* eslint-disable */

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch (e) { data = { title: 'Noirsurblanc', body: event.data?.text() || '' } }

  const title = data.title || 'Noirsurblanc'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [180, 90, 180],
    tag: data.tag || 'noirsurblanc',
    renotify: true,
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if (c.url.includes(url) && 'focus' in c) return c.focus()
      }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
