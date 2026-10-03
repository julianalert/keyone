import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../_og/og-card'

export const alt = 'keyone guides for agencies and freelancers running AI for clients'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({ eyebrow: 'Guides', title: 'Guides for agencies and freelancers', accent: 'running AI for clients.' })
}
