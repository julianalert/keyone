import { getAllPosts } from '../(marketing)/blog/posts'
import { getAllStories } from '../(marketing)/customers/stories'
import { getAllGuides } from '../(marketing)/guides/guides'
import { productPages } from '../(marketing)/product/pages'
import { useCases } from '../(marketing)/use-cases/use-cases'
import { SITE_DESCRIPTION, SITE_URL } from '../(marketing)/seo'

// llms.txt (https://llmstxt.org): a plain summary of the site for AI assistants and AI search.
export const dynamic = 'force-static'

export function GET() {
  const guides = getAllGuides()
  const posts = getAllPosts()
  const stories = getAllStories()
  const body = `# keyone

> ${SITE_DESCRIPTION}

keyone is an AI spend management platform for agencies and freelancers who run AI for clients: AI automation agencies, marketing agencies, freelance automation builders and dev shops. The business gets one account and one API key per client project; every call is attributed to its client and project, and checked against budgets, per-call caps and allowed tools and models before it reaches the provider. Usage is paid from a prepaid wallet, with no subscription.

## Pages

- [Home](${SITE_URL}/): what keyone does, features, how it works, the tool catalog and FAQ
- [Catalog](${SITE_URL}/catalog): every tool a project key can call, with models and prices
- [Pricing](${SITE_URL}/pricing): provider cost + 30% per call, prepaid wallet, no subscription
- [About](${SITE_URL}/about): company, team, differentiators and key facts
- [Use cases](${SITE_URL}/use-cases): who keyone is for, one page per kind of business
- [Guides](${SITE_URL}/guides): practical guides for agencies and freelancers running AI for clients
- [Book a demo](${SITE_URL}/demo): a 30-minute call with the founder

## Product

${productPages.map(p => `- [${p.name}](${SITE_URL}/product/${p.slug}): ${p.metaDescription}`).join('\n')}

## Use cases

${useCases.map(u => `- [${u.name}](${SITE_URL}/use-cases/${u.slug}): ${u.metaDescription}`).join('\n')}

## Guides

${guides.map(g => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${g.description}`).join('\n')}

## Blog

${posts.map(p => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${p.description}`).join('\n')}

## Customer stories

${stories.map(s => `- [${s.title}](${SITE_URL}/customers/${s.slug}): ${s.description}`).join('\n')}

## For agents

- [Developer docs](${SITE_URL}/docs): base URLs, keys, response headers, blocked calls, budget requests, MCP server and REST API
- [keyone skill file](${SITE_URL}/skill.md): how an agent sets up clients, project keys and spend limits through keyone

## Optional

- [Privacy Policy](${SITE_URL}/privacy)
- [Terms & Conditions](${SITE_URL}/terms)
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
