import type { MetadataRoute } from 'next'
import { getAllPosts } from './(marketing)/blog/posts'
import { getAllStories } from './(marketing)/customers/stories'
import { getAllGuides } from './(marketing)/guides/guides'
import { LEGAL_LAST_UPDATED_ISO } from './(marketing)/company'
import { productPages } from './(marketing)/product/pages'
import { PAGES_LAST_UPDATED, SITE_URL } from './(marketing)/seo'
import { useCases } from './(marketing)/use-cases/use-cases'

// Public marketing pages only; the dashboard and API are not indexed (see robots.ts).
export default function sitemap(): MetadataRoute.Sitemap {
  const guides = getAllGuides()
  const latestGuide = guides[0]?.updated ?? guides[0]?.published
  const posts = getAllPosts()
  const latestPost = posts[0]?.updated ?? posts[0]?.published
  const stories = getAllStories()

  return [
    { url: `${SITE_URL}/`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/product`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    ...productPages.map(page => ({
      url: `${SITE_URL}/product/${page.slug}`,
      lastModified: PAGES_LAST_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/use-cases`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    ...useCases.map(page => ({
      url: `${SITE_URL}/use-cases/${page.slug}`,
      lastModified: PAGES_LAST_UPDATED,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/catalog`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/pricing`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${SITE_URL}/about`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${SITE_URL}/blog`, lastModified: latestPost, changeFrequency: 'weekly', priority: 0.6 },
    ...posts.map(post => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updated ?? post.published,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/customers`, lastModified: stories[0]?.published, changeFrequency: 'monthly', priority: 0.7 },
    ...stories.map(story => ({
      url: `${SITE_URL}/customers/${story.slug}`,
      lastModified: story.updated ?? story.published,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    { url: `${SITE_URL}/docs`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/demo`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/careers`, lastModified: PAGES_LAST_UPDATED, changeFrequency: 'monthly', priority: 0.4 },
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
