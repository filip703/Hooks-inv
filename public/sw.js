// Service worker for PWA offline support + push notifications
const CACHE_NAME = 'inv-v5-chat-notifs'
const ASSETS = ['/', '/manifest.json']

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))),
      self.clients.claim()
    ])
  )
})

// Push notification handler
self.addEventListener('push', e => {
  if (!e.data) return
  try {
    const data = e.data.json()
    const title = data.title || 'DIO'
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.type || 'dio',
      data: { url: data.url || '/', type: data.type || 'general' },
      vibrate: [200, 100, 200],
      requireInteraction: false
    }
    e.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Push error:', err)
  }
})

// Click handler — robust för iOS PWA. Strategi:
// 1. Hitta öppen PWA-fönster → focus + postMessage med URL för intern navigation
// 2. Annars: öppna helt nytt fönster med URL
// Tar bort client.navigate() som är opålitligt på iOS PWA.
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const targetUrl = e.notification.data?.url || '/'
  const notifType = e.notification.data?.type || 'general'

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Try to focus existing PWA window first
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Skicka navigations-intention via postMessage så React kan hantera internt
          client.postMessage({ type: 'notification_click', url: targetUrl, notifType })
          if ('focus' in client) return client.focus()
        }
      }
      // No window open → öppna ny
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    }).catch(err => console.error('notificationclick error:', err))
  )
})
