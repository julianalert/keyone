import { createClient } from '@supabase/supabase-js'
import { clsx } from 'clsx/lite'

/* The live API catalog, same source as the dashboard's catalog page. */

export interface CatalogApi {
  name: string
  slug: string
  category: string
  description: string | null
  pricing_model: 'per_call' | 'per_result' | 'per_token'
  price_per_call: number | null
  price_per_result: number | null
  icon: string | null
}

// Active catalog entries are readable anonymously (RLS: catalog_apis_read).
// The page is regenerated at most once an hour.
export async function getCatalog(): Promise<CatalogApi[]> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { fetch: (input, init) => fetch(input, { ...init, next: { revalidate: 3600 } }) },
  })
  const { data, error } = await supabase
    .from('catalog_apis')
    .select('name, slug, category, description, pricing_model, price_per_call, price_per_result, icon')
    .eq('is_active', true)
    .order('category')
    .order('name')

  if (error) {
    console.error('Landing page catalog fetch failed:', error.message)
    return []
  }
  return data ?? []
}

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI Models',
  search: 'Search',
  geo: 'Geo',
  seo: 'SEO',
  social: 'Social',
}

const CATEGORY_TINTS: Record<string, string> = {
  ai: 'bg-brand-lime/20 text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime',
  geo: 'bg-brand-lime/20 text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime',
  search: 'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-300',
  seo: 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  social: 'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300',
}
const NEUTRAL_TINT = 'bg-olive-950/5 text-olive-700 dark:bg-white/10 dark:text-olive-300'

function formatPrice(api: CatalogApi): string {
  if (api.pricing_model === 'per_token') return 'from $0.20 / 1M tokens'
  if (api.pricing_model === 'per_result' && api.price_per_result) return `$${api.price_per_result.toFixed(4)} / result`
  if (api.pricing_model === 'per_call' && api.price_per_call) return `$${api.price_per_call.toFixed(4)} / call`
  return 'per call'
}

export function CatalogCard({ api }: { api: CatalogApi }) {
  const tint = CATEGORY_TINTS[api.category] ?? NEUTRAL_TINT

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-6 ring-1 ring-olive-950/5 dark:bg-white/5 dark:ring-white/10">
      <div className="flex items-start gap-3">
        <div className={clsx('flex size-10 shrink-0 items-center justify-center rounded-lg text-lg', tint)}>
          {api.icon ?? '🔌'}
        </div>
        <div className="min-w-0">
          <h3 className="text-base/7 font-medium text-olive-950 dark:text-white">{api.name}</h3>
          <span className={clsx('inline-block rounded-full px-2 text-xs/5 font-medium', tint)}>
            {CATEGORY_LABELS[api.category] ?? api.category}
          </span>
        </div>
      </div>
      <p className="flex-1 text-sm/7 text-olive-700 dark:text-olive-400">
        {api.description ?? 'No description available.'}
      </p>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm/6 font-medium text-brand-green dark:text-brand-lime">{formatPrice(api)}</span>
        <code className="rounded-sm bg-olive-950/5 px-2 py-0.5 font-mono text-xs/5 text-olive-700 dark:bg-white/10 dark:text-olive-300">
          /proxy/{api.slug}
        </code>
      </div>
    </div>
  )
}
