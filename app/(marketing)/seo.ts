import type { Metadata } from 'next'
import { appUrl } from '@/lib/config'

// Shared SEO and social metadata for the marketing site.

export const SITE_NAME = 'keyone'
export const SITE_URL = appUrl('https://getkeyone.com')
export const SITE_TAGLINE = 'Know what every client’s AI costs'
export const SITE_DESCRIPTION =
  'Run every client’s AI through one agency account. See what each client spends, set budgets, and get a clear breakdown to rebill or include in your retainer.'
export const X_HANDLE = '@notanothermrktr'
// Last meaningful content change to the home, product, catalog, pricing and about pages (for the sitemap); bump when they change
export const PAGES_LAST_UPDATED = '2026-10-02'

// Per-page metadata: canonical URL plus matching Open Graph and X (Twitter) tags.
// Share images come from the opengraph-image.tsx files next to each route.
export function pageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  openGraph,
}: {
  title: string
  description: string
  path: string
  absoluteTitle?: boolean
  openGraph?: Metadata['openGraph']
}): Metadata {
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url: path,
      title,
      description,
      ...openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      site: X_HANDLE,
      title,
      description,
    },
  }
}
