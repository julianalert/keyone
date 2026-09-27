import { OG_CONTENT_TYPE, OG_SIZE, ogCard } from '../_og/og-card'

export const alt = 'keyone pricing: provider cost plus 30%, no subscription'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return ogCard({
    eyebrow: 'Pricing',
    title: 'Provider cost',
    accent: '+ 30%.',
    footer: 'No subscription, no seats, no contract',
  })
}
