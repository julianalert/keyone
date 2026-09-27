import type { MetadataRoute } from 'next'
import { getAllGuides } from './(marketing)/guides/guides'
import { LEGAL_LAST_UPDATED_ISO } from './(marketing)/company'
import { PAGES_LAST_UPDATED, SITE_URL } from './(marketing)/seo'

// Public marketing pages only; the dashboard and API are not indexed (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const guides = getAllGuides()
  const latestGuide = guides[0]?.updated ?? guides[0]?.published

  return [
    { url: `${SITE_URL}/`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/pricing`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: latestGuide, changeFrequency: 'weekly', priority: 0.8 },
    ...guides.map(guide => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.updated ?? guide.published,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privacy`, lastModified: LEGAL_LAST_UPDATED_ISO, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, lastModified: LEGAL_LAST_UPDATED_ISO, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
