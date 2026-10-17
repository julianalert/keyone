import { createCollection } from '../guides/guides'
import { blogFigures } from './figures'

/*
 * Blog posts are Markdown files in content/blog/<slug>.md, with the same
 * frontmatter as guides (title, seoTitle, description, published, updated,
 * author, authorRole, authorImage, image). `##` headings feed the "On this page"
 * menu, and `<figure data-figure="name"></figure>` embeds a figure from figures.ts.
 */
const posts = createCollection('blog', { figures: blogFigures })

export const getPostSlugs = posts.slugs
export const getPost = posts.get
export const getAllPosts = posts.all
