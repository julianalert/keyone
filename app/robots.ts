import type { MetadataRoute } from 'next'
import { SITE_URL } from './(marketing)/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // The app itself: signed-in pages, auth flows and the API
      disallow: ['/dashboard', '/admin', '/onboarding', '/set-password', '/auth/', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
