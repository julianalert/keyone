import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../_og/og-card'

export const alt = 'About keyone, the API key and spend manager for AI agencies'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({ eyebrow: 'About', title: 'The API key and spend manager', accent: 'for AI agencies.' })
}
