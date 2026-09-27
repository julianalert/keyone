import { notFound } from 'next/navigation'

// Any URL that matches no other route renders the marketing 404 (./not-found.tsx)
// with the site's navbar and footer, instead of Next's unbranded default.
export default function CatchAll() {
  notFound()
}
