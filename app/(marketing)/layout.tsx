import type { Metadata } from 'next'
import { appUrl } from '@/lib/config'
import { SiteFooter, SiteNavbar } from './site-chrome'
import './marketing.css'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl('https://getkeyone.com')),
  title: 'keyone — One API key for every tool your agents need',
  description: 'Stop juggling API credentials and losing track of costs. One key, one wallet, full visibility across all your agents.',
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteNavbar />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
