export const runtime = 'edge'

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Virtual Launch Pro',
    template: '%s | Virtual Launch Pro',
  },
  description: 'Calm launch systems for tax professionals.',
  icons: {
    icon: [
      { url: '/assets/favicon.ico', type: 'image/x-icon' },
      { url: '/assets/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/assets/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
