import { createClient } from '@supabase/supabase-js'
import { ButtonLink } from '@/components/marketing/elements/button'
import { Main } from '@/components/marketing/elements/main'
import { Screenshot } from '@/components/marketing/elements/screenshot'
import { Section } from '@/components/marketing/elements/section'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { FAQsTwoColumnAccordion, Faq } from '@/components/marketing/sections/faqs-two-column-accordion'
import { HeroSimpleCentered } from '@/components/marketing/sections/hero-simple-centered'
import { CatalogCard, getCatalog } from '../catalog'
import { ConnectDemo } from '../product/demos'
import { pageMetadata } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'

// Regenerate hourly so tools and prices follow the live catalog
export const revalidate = 3600

export const metadata = pageMetadata({
  title: 'Catalog: every tool a keyone key can call',
  description:
    'The keyone catalog: AI models from OpenAI and Anthropic, plus search APIs, all behind one key per client project, with the price your wallet is charged.',
  path: '/catalog',
})

const MARGIN = 1 + Number(process.env.KEYONE_MARGIN_PCT ?? 30) / 100

const PROVIDER_NAMES: Record<string, string> = { openai: 'OpenAI', anthropic: 'Anthropic', perplexity: 'Perplexity' }

interface ModelPrice {
  provider: string
  model: string
  input: number
  output: number
}

// Chat model prices as a project is charged (provider price plus keyone's margin).
// Readable anonymously (RLS: model_prices_read). Returns [] if it can't be loaded.
async function getModelPrices(): Promise<ModelPrice[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return []
  try {
    const supabase = createClient(url, anonKey, { auth: { persistSession: false } })
    const { data, error } = await supabase
      .from('model_prices')
      .select('provider, model, kind, input_per_million, output_per_million')
      .eq('is_active', true)
      .neq('model', '*')
      .order('provider')
      .order('model')
    if (error) throw error
    return (data ?? [])
      .filter(r => (r.kind ?? 'chat') === 'chat')
      .map(r => ({
        provider: r.provider,
        model: r.model,
        input: Number(r.input_per_million) * MARGIN,
        output: Number(r.output_per_million) * MARGIN,
      }))
  } catch (error) {
    console.error('Catalog page model prices fetch failed:', error)
    return []
  }
}

const catalogFaqs = [
  {
    q: 'Do I need an account with each provider?',
    a: 'No. keyone provides access to its supported catalogue through your agency account and prepaid wallet. Each client project gets its own keyone API key.',
  },
  {
    q: 'Does one key really work for every tool?',
    a: 'Yes. A project key works for every tool in the catalog, unless you restrict that project to specific tools or models.',
  },
  {
    q: 'What are the prices on this page?',
    a: 'They are what your wallet is charged, per million tokens, per call or per result depending on the tool. Every API response also tells you what that call cost.',
  },
  {
    q: 'How often are tools added?',
    a: 'New tools are added regularly, and this page updates from the live catalog. If you need a tool that isn’t listed, tell us.',
  },
]

function price(n: number) {
  return `$${n < 1 ? n.toFixed(3) : n.toFixed(2)}`
}

export default async function CatalogPage() {
  const [catalog, prices] = await Promise.all([getCatalog(), getModelPrices()])
  const providers = Array.from(new Set(prices.map(p => p.provider)))

  return (
    <Main>
      <HeroSimpleCentered
        id="hero"
        eyebrow={<p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">Catalog</p>}
        headline={
          <>
            Every tool, <span className="text-brand-green italic dark:text-brand-lime">one key.</span>
          </>
        }
        subheadline={
          <p>
            AI models and search APIs behind a single key per client project, with more tools every month. No provider
            accounts to open, no keys to juggle.
          </p>
        }
        cta={
          <ButtonLink href="/signup" size="lg">
            Start with one client project <ArrowNarrowRightIcon />
          </ButtonLink>
        }
      />

      {/* Tools */}
      <Section
        id="tools"
        eyebrow="In the catalog today"
        headline="What a project key can call."
        subheadline={<p>Add a tool to a client’s workflow and nothing else changes: same key, same wallet, same report.</p>}
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {catalog.map(api => (
            <CatalogCard key={api.slug} api={api} />
          ))}
          <div className="flex items-center justify-center rounded-xl p-6 text-sm/7 text-olive-500 outline-1 -outline-offset-1 outline-olive-950/10 outline-dashed dark:outline-white/10">
            More tools every month
          </div>
        </div>
      </Section>

      {/* Model prices */}
      {prices.length > 0 && (
        <Section
          id="model-prices"
          eyebrow="Model prices"
          headline="What each model costs through keyone."
          subheadline={
            <p>
              USD per million tokens, as charged to your wallet. Image, audio and embedding models are listed in the
              dashboard catalog.
            </p>
          }
        >
          <div className="flex flex-col gap-2">
            {providers.map((provider, i) => {
              const rows = prices.filter(p => p.provider === provider)
              return (
                <details
                  key={provider}
                  open={i === 0}
                  className="group overflow-hidden rounded-xl bg-white ring-1 ring-olive-950/10 dark:bg-white/5 dark:ring-white/10"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 [&::-webkit-details-marker]:hidden">
                    <h3 className="text-base/7 font-medium text-olive-950 dark:text-white">
                      {PROVIDER_NAMES[provider] ?? provider}
                    </h3>
                    <span className="flex items-center gap-3 text-sm/7 text-olive-500">
                      {rows.length} models
                      <span className="text-lg/7 transition-transform group-open:rotate-45" aria-hidden="true">
                        +
                      </span>
                    </span>
                  </summary>
                  <div className="overflow-x-auto border-t border-olive-950/10 dark:border-white/10">
                    <table className="w-full text-sm/7">
                      <thead>
                        <tr className="bg-olive-950/2.5 text-left text-olive-950 dark:bg-white/5 dark:text-white">
                          <th className="px-6 py-2.5 font-semibold">Model</th>
                          <th className="px-6 py-2.5 text-right font-semibold whitespace-nowrap">Input / 1M</th>
                          <th className="px-6 py-2.5 text-right font-semibold whitespace-nowrap">Output / 1M</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-olive-950/10 dark:divide-white/10">
                        {rows.map(r => (
                          <tr key={r.model}>
                            <td className="px-6 py-2.5 font-mono text-xs/6 text-olive-950 dark:text-white">{r.model}</td>
                            <td className="px-6 py-2.5 text-right text-olive-700 tabular-nums dark:text-olive-400">
                              {price(r.input)}
                            </td>
                            <td className="px-6 py-2.5 text-right text-olive-700 tabular-nums dark:text-olive-400">
                              {price(r.output)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              )
            })}
          </div>
        </Section>
      )}

      {/* How to call */}
      <Section
        id="connect"
        eyebrow="How to call it"
        headline="Change the base URL and the key."
        subheadline={
          <p>
            keyone is a drop-in for the OpenAI and Anthropic SDKs. Streaming, tools and provider headers pass straight
            through.
          </p>
        }
        cta={
          <a
            href="/docs"
            className="inline-flex items-center gap-2 self-start text-sm/7 font-medium text-olive-950 dark:text-white"
          >
            Read the developer docs <ArrowNarrowRightIcon />
          </a>
        }
      >
        <Screenshot className="rounded-lg" wallpaper="green" placement="bottom">
          <ConnectDemo />
        </Screenshot>
      </Section>

      <FAQsTwoColumnAccordion id="faqs" headline="Catalog: questions.">
        {catalogFaqs.map((f, i) => (
          <Faq key={f.q} id={`catalog-faq-${i + 1}`} question={f.q} answer={f.a} />
        ))}
      </FAQsTwoColumnAccordion>

      <StartFreeCallToAction />
    </Main>
  )
}
