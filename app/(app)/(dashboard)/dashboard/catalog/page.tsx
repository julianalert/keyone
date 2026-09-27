'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'

interface CatalogApi {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  pricing_model: 'per_call' | 'per_result' | 'per_token'
  price_per_call: number | null
  price_per_result: number | null
  icon: string | null
}

interface ModelPrice {
  provider: string
  model: string
  input_per_million: number
  output_per_million: number
  cached_input_per_million: number | null
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'ai', label: 'AI Models' },
  { id: 'search', label: 'Search' },
  { id: 'geo', label: 'Geo' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Social' },
]

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  ai: { bg: '#EAF3DE', color: '#3B6D11' },
  search: { bg: '#E6F1FB', color: '#1D4ED8' },
  geo: { bg: '#EAF3DE', color: '#3B6D11' },
  seo: { bg: '#FAEEDA', color: '#92400E' },
  social: { bg: '#F3E8FF', color: '#7C3AED' },
}

function formatApiPrice(api: CatalogApi): string {
  if (api.pricing_model === 'per_token') {
    return 'from $0.20 / 1M tokens'
  }
  if (api.pricing_model === 'per_result' && api.price_per_result) {
    return `$${api.price_per_result.toFixed(4)} / result`
  }
  if (api.pricing_model === 'per_call' && api.price_per_call) {
    return `$${api.price_per_call.toFixed(4)} / call`
  }
  return 'per call'
}

export default function CatalogPage() {
  const [apis, setApis] = useState<CatalogApi[]>([])
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [prices, setPrices] = useState<ModelPrice[]>([])
  const [priceProvider, setPriceProvider] = useState<string>('all')
  const [origin, setOrigin] = useState('')
  useEffect(() => { setOrigin(window.location.origin) }, [])

  useEffect(() => {
    fetch('/api/pricing').then(r => r.json()).then(d => setPrices(d.models ?? [])).catch(() => {})
  }, [])

  const fetchApis = useCallback(async () => {
    const params = new URLSearchParams()
    if (category !== 'all') params.set('category', category)
    if (search) params.set('q', search)

    const res = await fetch(`/api/catalog?${params}`)
    const data = await res.json()
    setApis(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [category, search])

  useEffect(() => {
    const timer = setTimeout(fetchApis, search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [fetchApis, search])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="serif text-4xl font-normal mb-1">API Catalog</h1>
        <p className="text-sm text-ink-muted">
          Pre-wired APIs, ready to call. No accounts, no keys, no setup.
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle"
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.25"/>
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
          </svg>
          <input
            className="w-full pl-8 pr-3 py-2 bg-bg border rounded text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-ink-muted transition-colors"
            style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}
            placeholder="Search APIs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                category === cat.id
                  ? 'bg-ink text-bg'
                  : 'bg-transparent text-ink-muted hover:text-ink border border-border hover:border-ink-muted'
              }`}
              style={{ borderWidth: '0.5px' }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* API grid */}
      {loading ? (
        <div className="text-sm text-ink-muted">Loading...</div>
      ) : apis.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-ink-muted">No APIs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apis.map(api => (
            <ApiCard key={api.id} api={api} />
          ))}
        </div>
      )}

      {/* Docs note */}
      <div className="mt-12 p-5 rounded-xl bg-green-pale" style={{ border: '0.5px solid #C0DD97' }}>
        <p className="text-sm font-medium text-green-dark mb-1">How to call any API</p>
        <pre className="text-xs text-ink font-mono overflow-x-auto whitespace-pre-wrap">
{`POST ${origin}/api/proxy/{slug}
Authorization: Bearer kone_live_••••••••   ← your project key, nothing else
Content-Type: application/json

{ "model": "gpt-5-mini", "stream": true, "messages": [...] }`}
        </pre>
      </div>

      {/* Model pricing */}
      {prices.length > 0 && (
        <Card className="mt-8">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <div>
              <p className="text-sm font-medium text-ink">Model pricing</p>
              <p className="text-xs text-ink-muted">USD per 1M tokens, what your projects are charged. Unknown models bill at the provider&apos;s top tier.</p>
            </div>
            <div className="flex gap-1.5">
              {['all', ...Array.from(new Set(prices.map(p => p.provider)))].map(pv => (
                <button
                  key={pv}
                  onClick={() => setPriceProvider(pv)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${priceProvider === pv ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`}
                  style={{ borderWidth: '0.5px' }}
                >
                  {pv}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-2 grid grid-cols-12 gap-4 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <span className="col-span-2">Provider</span>
            <span className="col-span-4">Model</span>
            <span className="col-span-2 text-right">Input</span>
            <span className="col-span-2 text-right">Cached</span>
            <span className="col-span-2 text-right">Output</span>
          </div>
          {prices.filter(p => priceProvider === 'all' || p.provider === priceProvider).map((p, i, arr) => (
            <div
              key={`${p.provider}/${p.model}`}
              className="px-5 py-2.5 grid grid-cols-12 gap-4 text-sm"
              style={i < arr.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
            >
              <span className="col-span-2 text-ink-muted text-xs">{p.provider}</span>
              <span className="col-span-4 font-mono text-xs text-ink">{p.model}</span>
              <span className="col-span-2 text-right text-ink">${p.input_per_million.toFixed(2)}</span>
              <span className="col-span-2 text-right text-ink-muted">{p.cached_input_per_million === null ? '—' : `$${p.cached_input_per_million.toFixed(2)}`}</span>
              <span className="col-span-2 text-right text-ink">${p.output_per_million.toFixed(2)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}

function ApiCard({ api }: { api: CatalogApi }) {
  const colors = CATEGORY_COLORS[api.category] ?? { bg: '#F1EFE8', color: '#5F5E5A' }

  return (
    <Card className="p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ background: colors.bg }}
        >
          {api.icon ?? '🔌'}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-ink">{api.name}</h3>
          <span
            className="text-2xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5"
            style={{ background: colors.bg, color: colors.color }}
          >
            {api.category}
          </span>
        </div>
      </div>

      <p className="text-xs text-ink-muted leading-relaxed mb-3">
        {api.description ?? 'No description available.'}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-xs text-green-dark font-medium">{formatApiPrice(api)}</span>
        <code
          className="text-2xs text-ink-muted font-mono px-2 py-1 rounded"
          style={{ background: '#F1EFE8' }}
        >
          /proxy/{api.slug}
        </code>
      </div>
    </Card>
  )
}
