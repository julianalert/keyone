import { handleProxy } from '@/lib/proxy/handler'

export const runtime = 'nodejs'
// Long generations (Opus, Fable, big prompts) need the full function budget on Vercel
export const maxDuration = 300

// POST /api/proxy/:slug — call a catalog tool with a project key
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  return handleProxy(req, params.slug)
}
