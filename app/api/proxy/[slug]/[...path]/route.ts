import { handleProxy } from '@/lib/proxy/handler'

export const runtime = 'nodejs'
// Long generations (Opus, Fable, big prompts) need the full function budget on Vercel
export const maxDuration = 300

// SDK-compatible paths. Point the OpenAI SDK at /api/proxy/openai/v1 and the
// Anthropic SDK at /api/proxy/anthropic; their own paths are appended here.
export async function POST(req: Request, { params }: { params: { slug: string; path: string[] } }) {
  return handleProxy(req, params.slug, params.path.join('/'))
}
