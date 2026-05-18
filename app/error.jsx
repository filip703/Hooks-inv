'use client'

// Next.js App Router error boundary — fångar runtime crashes och visar reset-UI
// istället för generisk "Application error: a client-side exception has occurred"
import { useEffect, useState } from 'react'

export default function Error({ error, reset }) {
  const [resetting, setResetting] = useState(false)
  const [details, setDetails] = useState(false)

  useEffect(() => {
    console.error('[ErrorBoundary] Catched:', error)
  }, [error])

  const hardReset = async () => {
    setResetting(true)
    try {
      // Rensa allt: localStorage, sessionStorage, Cache API, Service Workers
      if (typeof window !== 'undefined') {
        try { localStorage.clear() } catch (e) {}
        try { sessionStorage.clear() } catch (e) {}
        try {
          if ('caches' in window) {
            const keys = await caches.keys()
            await Promise.all(keys.map(k => caches.delete(k)))
          }
        } catch (e) {}
        try {
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations()
            await Promise.all(regs.map(r => r.unregister()))
          }
        } catch (e) {}
      }
      // Reload utan cache
      window.location.href = '/'
    } catch (e) {
      setResetting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0B1410 0%, #0C1830 50%, #0B1410 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      gap: 18,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Manrope", system-ui, sans-serif',
      color: '#FAF8F0'
    }}>
      <div style={{ fontSize: 56, marginBottom: 4 }}>⚠️</div>
      <div style={{ fontFamily: 'var(--serif, "Fraunces", Georgia, serif)', fontSize: 22, color: '#D4AF37', textAlign: 'center' }}>
        Något gick sönder
      </div>
      <div style={{ fontSize: 13, color: 'rgba(250,248,240,0.6)', textAlign: 'center', maxWidth: 360, lineHeight: 1.5 }}>
        Appen kraschade vid start. Troligast en cache-konflikt efter senaste deploy. Tryck nedan för att rensa lokal data och ladda om.
      </div>

      <button
        onClick={hardReset}
        disabled={resetting}
        style={{
          marginTop: 8,
          padding: '14px 22px',
          background: '#D4AF37',
          color: '#0A0A08',
          border: 'none',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          cursor: resetting ? 'wait' : 'pointer',
          minWidth: 240,
          boxShadow: '0 4px 16px rgba(212,175,55,0.3)'
        }}
      >
        {resetting ? 'Rensar...' : '🔄 Rensa cache och ladda om'}
      </button>

      <button
        onClick={() => { try { reset() } catch (e) { window.location.reload() } }}
        style={{
          padding: '10px 18px',
          background: 'transparent',
          color: 'rgba(250,248,240,0.6)',
          border: '1px solid rgba(250,248,240,0.2)',
          borderRadius: 10,
          fontSize: 12,
          cursor: 'pointer',
          minWidth: 240
        }}
      >
        Försök igen utan att rensa
      </button>

      <button
        onClick={() => setDetails(d => !d)}
        style={{
          marginTop: 18,
          background: 'none',
          border: 'none',
          color: 'rgba(250,248,240,0.4)',
          fontSize: 11,
          fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
          cursor: 'pointer',
          letterSpacing: 1
        }}
      >
        {details ? 'DÖLJ TEKNISK INFO' : 'VISA TEKNISK INFO'}
      </button>

      {details && (
        <pre style={{
          width: '100%',
          maxWidth: 480,
          maxHeight: 240,
          overflow: 'auto',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(250,248,240,0.1)',
          borderRadius: 8,
          padding: 12,
          fontSize: 10,
          fontFamily: 'var(--mono, "JetBrains Mono", monospace)',
          color: 'rgba(250,248,240,0.7)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {error?.message || 'Okänt fel'}
          {error?.digest && `\n\nDigest: ${error.digest}`}
          {error?.stack && `\n\n${error.stack.slice(0, 800)}`}
        </pre>
      )}
    </div>
  )
}
