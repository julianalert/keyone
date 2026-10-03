import { createCollection } from '../guides/guides'

/*
 * Customer stories are Markdown files in content/customers/<slug>.md.
 *
 * Frontmatter, on top of the usual title / seoTitle / description / published:
 *   author, authorRole, authorImage   the person quoted
 *   company, website, industry, location, team, clients, uses   "At a glance" card
 *   quote        pull quote shown after the story
 *   highlights   results, separated by " | "
 *   disclosure   optional note shown in the card (e.g. a relationship with keyone)
 *
 * Body sections (## headings): The agency, The challenge, The setup, The results.
 */
const stories = createCollection('customers')

export const getStorySlugs = stories.slugs
export const getStory = stories.get
export const getAllStories = stories.all
