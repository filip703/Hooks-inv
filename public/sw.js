// Service worker for PWA offline support + push notifications
const CACHE_NAME = 'inv-v3-2026-05-16'
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
      self.clients.claim() // tar över alla öppna klienter direkt så de får ny version
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
      data: { url: data.url || '/' },
      vibrate: [200, 100, 200]
    }
    e.waitUntil(self.registration.showNotification(title, options))
  } catch (err) {
    console.error('Push error:', err)
  }
})

// Click handler – open app at URL
self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
