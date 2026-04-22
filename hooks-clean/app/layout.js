import './globals.css'
import '../styles/midnight-lake.css'

export const metadata = {
  title: 'Douche Invitational Only 2026',
  description: 'Douche Invitational Only 2026 · Hooks Herrgård - 72 hål · 6 spelare · 1 buckla',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'DIO 2026' },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 3,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#1B4332',
}

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="DIO 2026" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js')` }} />
      </body>
    </html>
  )
}
