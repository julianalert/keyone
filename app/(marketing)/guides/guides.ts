import fs from 'fs'
import path from 'path'
import { Marked, type Tokens } from 'marked'

/*
 * Guides are Markdown files in content/guides/<slug>.md with a frontmatter block:
 *
 *   ---
 *   title: "…"
 *   description: "…"   (meta description, also shown under the title)
 *   published: 2026-09-27
 *   updated: 2026-10-02 (optional)
 *   icon: chart | banknotes | key | document  (optional, shown in the navbar menu)
 *   author: Carine
 *   authorImage: /carine.jpeg  (optional, a file in public/)
 *   ---
 *
 * The body starts after the frontmatter (no H1: the title comes from the frontmatter).
 * Every `##` heading becomes an entry in the "On this page" menu.
 */

const GUIDES_DIR = path.join(process.cwd(), 'content', 'guides')
const WORDS_PER_MINUTE = 230

export interface GuideMeta {
  slug: string
  title: string
  description: string
  published: string
  updated?: string
  icon?: string
  author: string
  authorImage?: string
  readingMinutes: number
}

export interface TocEntry {
  id: string
  text: string
}

export interface Guide extends GuideMeta {
  html: string
  toc: TocEntry[]
}

function parseFrontmatter(source: string, file: string) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?/)
  if (!match) throw new Error(`Guide ${file} is missing its frontmatter block`)

  const data: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const field = line.match(/^(\w+):\s*(.*)$/)
    if (field) data[field[1]] = field[2].trim().replace(/^"(.*)"$/, '$1')
  }
  for (const key of ['title', 'description', 'published']) {
    if (!data[key]) throw new Error(`Guide ${file} is missing "${key}" in its frontmatter`)
  }
  return { data, body: source.slice(match[0].length) }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function stripInline(text: string) {
  return text.replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
}

function renderMarkdown(body: string) {
  const toc: TocEntry[] = []
  const usedIds = new Set<string>()

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth, text }: Tokens.Heading) {
        const plain = stripInline(text)
        let id = slugify(plain)
        for (let n = 2; usedIds.has(id); n++) id = `${slugify(plain)}-${n}`
        usedIds.add(id)
        if (depth === 2) toc.push({ id, text: plain })
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>\n`
      },
      // A paragraph that is a single bold run (a key takeaway or a formula) renders as a callout
      paragraph({ tokens }: Tokens.Paragraph) {
        const callout = tokens.length === 1 && tokens[0].type === 'strong'
        return `<p${callout ? ' class="callout"' : ''}>${this.parser.parseInline(tokens)}</p>\n`
      },
      link({ href, title, tokens }: Tokens.Link) {
        const external = /^https?:\/\//.test(href) && !/^https?:\/\/(www\.)?getkeyone\.com/.test(href)
        const attrs = [
          `href="${href}"`,
          title ? `title="${title}"` : '',
          external ? 'target="_blank" rel="noopener noreferrer"' : '',
        ]
        return `<a ${attrs.filter(Boolean).join(' ')}>${this.parser.parseInline(tokens)}</a>`
      },
    },
  })

  const html = (marked.parse(body) as string)
    // Let wide tables scroll horizontally on small screens
    .replaceAll('<table>', '<div class="table-wrap"><table>')
    .replaceAll('</table>', '</table></div>')
    // Task lists (`- [ ] …`) render as checklists
    .replace(/<ul>\n(?=<li><input)/g, '<ul class="checklist">\n')

  return { html, toc }
}

function readGuide(slug: string): Guide {
  const file = `${slug}.md`
  const { data, body } = parseFrontmatter(fs.readFileSync(path.join(GUIDES_DIR, file), 'utf8'), file)
  const { html, toc } = renderMarkdown(body)
  const words = body.split(/\s+/).filter(Boolean).length

  return {
    slug,
    title: data.title,
    description: data.description,
    published: data.published,
    updated: data.updated,
    icon: data.icon,
    author: data.author || 'Keyone',
    authorImage: data.authorImage,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    html,
    toc,
  }
}

export function getGuideSlugs(): string[] {
  return fs
    .readdirSync(GUIDES_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''))
}

export function getGuide(slug: string): Guide | null {
  return getGuideSlugs().includes(slug) ? readGuide(slug) : null
}

// Newest first
export function getAllGuides(): GuideMeta[] {
  return getGuideSlugs()
    .map(slug => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { html, toc, ...meta } = readGuide(slug)
      return meta
    })
    .sort((a, b) => b.published.localeCompare(a.published))
}

export function formatGuideDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
