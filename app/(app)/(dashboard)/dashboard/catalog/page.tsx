'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/Card'
import { ProviderLogo } from '@/components/ui/ProviderLogo'

interface CatalogApi {
  id: string
  name: string
  slug: string
  category: string
  description: string | null
  provider: string
  pricing_model: 'per_call' | 'per_result' | 'per_token'
  price_per_call: number | null
  price_per_result: number | null
  icon: string | null
}

type PriceKind = 'chat' | 'image' | 'embedding' | 'speech' | 'transcription' | 'audio' | 'moderation' | 'search' | 'tool' | 'legacy'

interface ModelPrice {
  provider: string
  model: string
  kind: PriceKind
  unit: 'token' | 'character' | 'minute' | 'request' | 'image'
  input_per_million: number
  output_per_million: number
  cached_input_per_million: number | null
  per_unit: number | null
  image_input_per_million: number | null
  image_output_per_million: number | null
  audio_input_per_million: number | null
  audio_output_per_million: number | null
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

// Order and labels for the pricing table sections
const KINDS: Array<{ id: PriceKind; label: string; columns: [string, string, string] }> = [
  { id: 'chat', label: 'Chat & reasoning', columns: ['Input', 'Cached', 'Output'] },
  { id: 'image', label: 'Image generation', columns: ['Text in', 'Image in', 'Image out'] },
  { id: 'audio', label: 'Audio chat', columns: ['Text in / out', 'Audio in', 'Audio out'] },
  { id: 'speech', label: 'Text to speech', columns: ['', '', 'Per 1M characters'] },
  { id: 'transcription', label: 'Transcription', columns: ['Text in', 'Audio in', 'Text out'] },
  { id: 'embedding', label: 'Embeddings', columns: ['Input', '', ''] },
  { id: 'search', label: 'Search', columns: ['', '', 'Per request'] },
  { id: 'tool', label: 'Hosted tools', columns: ['', '', 'Per call'] },
  { id: 'moderation', label: 'Moderation', columns: ['', '', ''] },
  { id: 'legacy', label: 'Legacy', columns: ['Input', 'Cached', 'Output'] },
]

const KIND_CHIPS: Partial<Record<PriceKind, string>> = {
  image: 'Images', audio: 'Audio', speech: 'Speech', transcription: 'Transcription', embedding: 'Embeddings', search: 'Search',
}

const usd = (v: number | null | undefined, digits = 2) => (v === null || v === undefined ? '—' : `$${v.toFixed(digits)}`)

// What a summary line on a provider card says, from the live price table
function providerSummary(provider: string, prices: ModelPrice[]): { models: number; from: string | null; chips: string[] } {
  const rows = prices.filter(p => p.provider === provider)
  const chat = rows.filter(p => p.kind === 'chat')
  const cheapest = chat.length ? Math.min(...chat.map(p => p.input_per_million)) : null
  const chips = KINDS.map(k => k.id).filter(k => KIND_CHIPS[k] && rows.some(r => r.kind === k)).map(k => KIND_CHIPS[k]!)
  return { models: chat.length, from: cheapest === null ? null : `${usd(cheapest)} / 1M tokens`, chips }
}

// Three cells per row, matching the section's column labels
function priceCells(p: ModelPrice): [string, string, string] {
  switch (p.kind) {
    case 'image':
      if (p.unit === 'image') return ['', '', `${usd(p.per_unit, 3)} / image`]
      return [usd(p.input_per_million), usd(p.image_input_per_million), usd(p.image_output_per_million)]
    case 'audio':
      return [`${usd(p.input_per_million)} / ${usd(p.output_per_million)}`, usd(p.audio_input_per_million), usd(p.audio_output_per_million)]
    case 'speech':
      return ['', '', usd(p.input_per_million)]
    case 'transcription':
      if (p.unit === 'minute') return ['', '', `${usd(p.per_unit, 4)} / minute`]
      return [usd(p.input_per_million), usd(p.audio_input_per_million), usd(p.output_per_million)]
    case 'embedding':
      return [usd(p.input_per_million), '', '']
    case 'search':
    case 'tool':
      return ['', '', usd(p.per_unit, 4)]
    case 'moderation':
      return ['', '', 'free']
    default:
      return [usd(p.input_per_million), usd(p.cached_input_per_million), usd(p.output_per_million)]
  }
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

  const providers = useMemo(() => Array.from(new Set(prices.map(p => p.provider))), [prices])
  const visible = prices.filter(p => priceProvider === 'all' || p.provider === priceProvider)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="serif text-4xl font-normal mb-1">Catalog</h1>
        <p className="text-sm text-ink-muted">
          Every model and tool a project key can call. No provider accounts, no extra keys.
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
            placeholder="Search tools..."
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
          <p className="text-sm text-ink-muted">No tools found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {apis.map(api => (
            <ApiCard key={api.id} api={api} summary={providerSummary(api.provider, prices)} />
          ))}
        </div>
      )}

      {/* Docs note */}
      <div className="mt-12 p-5 rounded-xl bg-green-pale" style={{ border: '0.5px solid #C0DD97' }}>
        <p className="text-sm font-medium text-green-dark mb-1">How to call any tool</p>
        <p className="text-xs text-ink-muted mb-3">
          Point the provider&apos;s own SDK at key.one and use the project key as the API key. Every endpoint the provider exposes goes through: chat, responses, images, embeddings, audio, search.
        </p>
        <pre className="text-xs text-ink font-mono overflow-x-auto whitespace-pre-wrap">
{`OpenAI SDK      base_url = ${origin}/api/proxy/openai/v1
Anthropic SDK   base_url = ${origin}/api/proxy/anthropic
Perplexity      POST ${origin}/api/proxy/perplexity/v1/agent   ·   POST ${origin}/api/proxy/perplexity/search

Authorization: Bearer kone_live_••••••••   ← your project key, nothing else`}
        </pre>
      </div>

      {/* Model pricing */}
      {prices.length > 0 && (
        <Card className="mt-8">
          <div className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <div>
              <p className="text-sm font-medium text-ink">Model pricing</p>
              <p className="text-xs text-ink-muted">USD per 1M tokens unless stated, what your projects are charged. Unknown models bill at the provider&apos;s top tier.</p>
            </div>
            <div className="flex gap-1.5">
              {['all', ...providers].map(pv => (
                <button
                  key={pv}
                  onClick={() => setPriceProvider(pv)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors inline-flex items-center gap-1.5 ${priceProvider === pv ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`}
                  style={{ borderWidth: '0.5px' }}
                >
                  {pv !== 'all' && <ProviderLogo provider={pv} size={12} />}
                  {pv}
                </button>
              ))}
            </div>
          </div>
          {KINDS.map(kind => {
            const rows = visible.filter(p => p.kind === kind.id)
            if (rows.length === 0) return null
            return (
              <div key={kind.id}>
                <div className="px-5 py-2 grid grid-cols-12 gap-4 text-2xs text-ink-subtle uppercase tracking-wider bg-bg" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
                  <span className="col-span-6 text-ink-muted normal-case tracking-normal text-xs font-medium">{kind.label}</span>
                  <span className="col-span-2 text-right">{kind.columns[0]}</span>
                  <span className="col-span-2 text-right">{kind.columns[1]}</span>
                  <span className="col-span-2 text-right">{kind.columns[2]}</span>
                </div>
                {rows.map(p => {
                  const [a, b, c] = priceCells(p)
                  return (
                    <div
                      key={`${p.provider}/${p.model}`}
                      className="px-5 py-2.5 grid grid-cols-12 gap-4 text-sm"
                      style={{ borderBottom: '0.5px solid #e0ddd7' }}
                    >
                      <span className="col-span-2 text-ink-muted text-xs inline-flex items-center gap-1.5"><ProviderLogo provider={p.provider} size={12} />{p.provider}</span>
                      <span className="col-span-4 font-mono text-xs text-ink truncate" title={p.model}>{p.model}</span>
                      <span className="col-span-2 text-right text-ink">{a}</span>
                      <span className="col-span-2 text-right text-ink-muted">{b}</span>
                      <span className="col-span-2 text-right text-ink">{c}</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </Card>
      )}
    </div>
  )
}

function ApiCard({ api, summary }: { api: CatalogApi; summary: { models: number; from: string | null; chips: string[] } }) {
  const colors = CATEGORY_COLORS[api.category] ?? { bg: '#F1EFE8', color: '#5F5E5A' }
  const priceLine =
    api.pricing_model === 'per_token'
      ? summary.from
        ? `${summary.models} models · from ${summary.from}`
        : 'per token'
      : api.pricing_model === 'per_result' && api.price_per_result
        ? `$${api.price_per_result.toFixed(4)} / result`
        : api.price_per_call
          ? `$${api.price_per_call.toFixed(4)} / call`
          : 'per call'

  return (
    <Card className="p-5 hover:shadow-sm transition-shadow flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-ink"
          style={{ background: colors.bg }}
        >
          <ProviderLogo provider={api.provider} size={18} />
        </div>
        <h3 className="text-sm font-medium text-ink flex-1 min-w-0 pt-2">{api.name}</h3>
        <span
          className="text-2xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ background: colors.bg, color: colors.color }}
        >
          {api.category}
        </span>
      </div>

      <p className="text-xs text-ink-muted leading-relaxed mb-3 flex-1">
        {api.description ?? 'No description available.'}
      </p>

      {summary.chips.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {summary.chips.map(c => (
            <span key={c} className="text-2xs px-1.5 py-0.5 rounded text-ink-muted" style={{ background: '#F1EFE8' }}>{c}</span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-green-dark font-medium">{priceLine}</span>
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
