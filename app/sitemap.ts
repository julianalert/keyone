import type { MetadataRoute } from 'next'
import { getAllGuides } from './(marketing)/guides/guides'
import { SITE_URL } from './(marketing)/seo'

// Public marketing pages only; the dashboard and API are not indexed (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const guides = getAllGuides()
  const latestGuide = guides[0]?.updated ?? guides[0]?.published

  return [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/guides`, lastModified: latestGuide, changeFrequency: 'weekly', priority: 0.8 },
    ...guides.map(guide => ({
      url: `${SITE_URL}/guides/${guide.slug}`,
      lastModified: guide.updated ?? guide.published,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/privacy`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
