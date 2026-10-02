import { createCollection } from '../guides/guides'

/*
 * Blog posts are Markdown files in content/blog/<slug>.md, with the same
 * frontmatter as guides (title, seoTitle, description, published, updated,
 * author, authorRole, authorImage). `##` headings feed the "On this page" menu.
 */
const posts = createCollection('blog')

export const getPostSlugs = posts.slugs
export const getPost = posts.get
export const getAllPosts = posts.all
