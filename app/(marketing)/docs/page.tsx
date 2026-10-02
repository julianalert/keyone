import fs from 'fs'
import path from 'path'
import { Main } from '@/components/marketing/elements/main'
import { GuideArticle } from '@/components/marketing/sections/guide-article'
import { formatGuideDate, parseFrontmatter, renderMarkdown } from '../guides/guides'
import { pageMetadata, SITE_URL } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'
import { AgentSetup } from './agent-setup'

/*
 * Developer docs: one page rendered from content/docs/index.md with the same
 * reading layout and "On this page" menu as the guides. `{{ORIGIN}}` in the
 * Markdown is replaced with the site URL. The agent-facing version of this
 * content is /skill.md (app/skill.md/route.ts); keep the two in step.
 */

function loadDocs() {
  const file = path.join(process.cwd(), 'content', 'docs', 'index.md')
  const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'), 'docs/index.md', ['title', 'description'])
  return {
    title: data.title,
    description: data.description,
    updated: data.updated as string | undefined,
    ...renderMarkdown(body.replaceAll('{{ORIGIN}}', SITE_URL)),
  }
}

const docs = loadDocs()
const AGENTS_ID = 'for-ai-agents'

export const metadata = pageMetadata({
  title: 'Developer docs: connect a project to keyone',
  description: docs.description,
  path: '/docs',
})

export default function DocsPage() {
  return (
    <Main>
      <GuideArticle
        id="docs"
        eyebrow="Developers"
        headline={docs.title}
        subheadline={<p>{docs.description}</p>}
        meta={
          docs.updated ? (
            <span>
              Updated <time dateTime={docs.updated}>{formatGuideDate(docs.updated)}</time> · For agents:{' '}
              <a href="/skill.md" className="font-medium text-olive-950 underline underline-offset-4 dark:text-white">
                skill.md
              </a>
            </span>
          ) : undefined
        }
        // "For AI agents" comes first: it is the easiest way to connect
        toc={[{ id: AGENTS_ID, text: 'For AI agents' }, ...docs.toc]}
        lead={<AgentSetup origin={SITE_URL} id={AGENTS_ID} />}
        html={docs.html}
      />
      <StartFreeCallToAction />
    </Main>
  )
}
