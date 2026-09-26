import { handleProxy } from '@/lib/proxy/handler'

export const runtime = 'nodejs'

// POST /api/proxy/:slug — call a catalog tool with a project key
export async function POST(req: Request, { params }: { params: { slug: string } }) {
  return handleProxy(req, params.slug)
}
