import './globals.css'

export const metadata = {
  title: 'The Invitational 2026',
  description: 'Hooks Herrgård Invitational 2026 - 72 hål · 6 spelare · 1 grön kavaj',
  manifest: '/manifest.json',
  themeColor: '#C9A84C',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 1, userScalable: false, viewportFit: 'cover' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Invitational' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="sv">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>{children}</body>
    </html>
  )
}
