import type { ProviderAdapter } from './types'

export const dataforseo: ProviderAdapter = {
  id: 'dataforseo',
  buildUrl: (api, path) => (path ? `${new URL(api.base_url).origin}/${path}` : api.base_url),
  buildHeaders: () => {
    const credentials = Buffer.from(
      `${process.env.DATAFORSEO_LOGIN}:${process.env.DATAFORSEO_PASSWORD}`
    ).toString('base64')
    return { 'Content-Type': 'application/json', Authorization: `Basic ${credentials}` }
  },
  resultCount: json => {
    const body = json as { tasks?: Array<{ result?: Array<{ items?: unknown[] }> }> }
    return body.tasks?.[0]?.result?.[0]?.items?.length ?? 0
  },
}
