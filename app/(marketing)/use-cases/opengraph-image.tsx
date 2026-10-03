import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../_og/og-card'

export const alt = 'keyone use cases: agencies, freelancers and dev shops running AI for clients'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({ eyebrow: 'Use cases', title: 'Built for anyone who runs AI', accent: 'for clients.' })
}
