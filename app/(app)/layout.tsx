import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'key.one — One API key for every tool your agents need',
  description: 'Stop juggling API credentials and losing track of costs. One key, one wallet, full visibility across all your agents.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
