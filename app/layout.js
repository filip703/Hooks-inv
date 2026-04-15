import './globals.css'

export const metadata = {
  title: 'The Invitational 2026',
  description: 'Hooks Herrgård Invitational 2026 - 72 hål · 6 spelare · 1 grön kavaj',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Invitational' },
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 3,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#0A0A08',
}

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Invitational" />
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
