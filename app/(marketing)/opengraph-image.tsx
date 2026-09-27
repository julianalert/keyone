import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from './_og/og-card'

export const alt = 'keyone: know what every client’s AI costs'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({ eyebrow: 'For agencies running AI for clients', title: 'Know what every client’s', accent: 'AI costs.' })
}
