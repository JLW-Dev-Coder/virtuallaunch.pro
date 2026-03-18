import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Help Center | Virtual Launch Pro' }

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
