import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../_og/og-card'

export const alt = 'keyone guides for agencies running AI for clients'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({ eyebrow: 'Guides', title: 'Practical guides for agencies', accent: 'running AI for clients.' })
}
