import { ButtonLink } from '@/components/marketing/elements/button'
import { Container } from '@/components/marketing/elements/container'
import { Main } from '@/components/marketing/elements/main'
import { Subheading } from '@/components/marketing/elements/subheading'
import { Text } from '@/components/marketing/elements/text'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { FAQsTwoColumnAccordion, Faq } from '@/components/marketing/sections/faqs-two-column-accordion'
import { HeroSimpleCentered } from '@/components/marketing/sections/hero-simple-centered'
import { PricingSingleTierTwoColumn } from '@/components/marketing/sections/pricing-single-tier-two-column'
import { pageMetadata, SITE_URL } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'

// The margin applied to provider prices (KEYONE_MARGIN_PCT in the app, default 30)
const MARGIN_PCT = 30

export const metadata = pageMetadata({
  title: 'Pricing: provider cost + 30%',
  description:
    'keyone pricing is simple: every call is billed at the provider’s price plus 30%, from a prepaid wallet. No subscription, no seats, no contract.',
  path: '/pricing',
})

const included = [
  'Every tool in the catalog on one key per client project',
  'Clients, projects and project keys for your whole agency',
  'Budgets, per-call caps and allowed tools and models',
  'Alerts, spike auto-freeze and budget requests',
  'Client reports and CSV exports with your own markup',
  'Controller agent, MCP server and skill file',
  'Your team, with owner, admin and member roles',
]

const examples = [
  { usage: 'One model call', provider: 0.01, keyone: 0.013 },
  { usage: 'A client’s month of automations', provider: 100, keyone: 130 },
  { usage: 'Ten clients at that volume', provider: 1000, keyone: 1300 },
]

const pricingFaqs = [
  {
    q: 'Is there a subscription or a minimum?',
    a: 'No. There is no monthly fee, no per-seat price and no contract. You pay only for the calls you make, from a prepaid wallet you top up from $5.',
  },
  {
    q: 'How is each call priced?',
    a: `Model calls are billed at the provider’s list price per token plus ${MARGIN_PCT}%. Search and data tools are billed per call or per result at the price shown in your catalog, and every API response tells you exactly what that call cost.`,
  },
  {
    q: 'What does the 30% cover?',
    a: 'Access to every tool in the catalog without provider accounts, plus everything around it: per-client spend tracking, budgets and caps, alerts, auto-freeze, reports and exports, and the controller agent.',
  },
  {
    q: 'What happens when my wallet runs out?',
    a: 'New calls are refused with a clear “insufficient balance” response and a link to top up, so nothing is charged that you haven’t funded. The dashboard warns you when your balance runs low.',
  },
  {
    q: 'Can I rebill my clients with my own markup?',
    a: 'Yes. Set a markup per client and export line items ready to invoice, with cost, price and rebill amount in every row. What you charge your clients is up to you.',
  },
]

function money(n: number) {
  return n < 1 ? `$${n.toFixed(3)}` : `$${n.toLocaleString('en-US')}`
}

export default function PricingPage() {
  return (
    <Main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            url: `${SITE_URL}/pricing`,
            mainEntity: pricingFaqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }).replace(/</g, '\\u003c'),
        }}
      />

      <HeroSimpleCentered
        id="hero"
        eyebrow={<p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">Pricing</p>}
        headline={
          <>
            Provider cost <span className="text-brand-green italic dark:text-brand-lime">+ {MARGIN_PCT}%.</span>
          </>
        }
        subheadline={
          <p>
            One price for every call, every tool and every client. No subscription, no seats, no contract. That’s it.
          </p>
        }
      />

      <PricingSingleTierTwoColumn
        id="pricing"
        headline="Pay for calls. Everything else is included."
        subheadline={
          <p>
            Top up one prepaid wallet for your agency. Each call is billed at the provider’s price plus {MARGIN_PCT}%, and
            each response tells you what it cost.
          </p>
        }
        price={`+${MARGIN_PCT}%`}
        period="on provider prices"
        features={included}
        cta={
          <div className="flex flex-col gap-4">
            <ButtonLink href="/signup" size="lg" className="self-start">
              Start with one client project <ArrowNarrowRightIcon />
            </ButtonLink>
            <p className="text-sm/7 text-olive-500">No monthly subscription. Add funds when you’re ready to run.</p>
          </div>
        }
      />

      {/* What you actually pay */}
      <section id="examples" className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-2xl flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">In practice</p>
              <Subheading>What you actually pay</Subheading>
            </div>
            <Text className="text-pretty">
              <p>
                Illustrative amounts. Your wallet is charged the provider’s price plus {MARGIN_PCT}%; how much you rebill
                each client is your call.
              </p>
            </Text>
          </div>
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-olive-950/10 dark:bg-white/5 dark:ring-white/10">
            <table className="w-full text-sm/7">
              <thead>
                <tr className="bg-olive-950/2.5 text-left text-olive-950 dark:bg-white/5 dark:text-white">
                  <th className="px-6 py-3 font-semibold">Usage</th>
                  <th className="px-6 py-3 text-right font-semibold">Provider price</th>
                  <th className="px-6 py-3 text-right font-semibold">You pay with keyone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-950/10 dark:divide-white/10">
                {examples.map(e => (
                  <tr key={e.usage}>
                    <td className="px-6 py-3 font-medium text-olive-950 dark:text-white">{e.usage}</td>
                    <td className="px-6 py-3 text-right text-olive-700 tabular-nums dark:text-olive-400">
                      {money(e.provider)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-brand-green tabular-nums dark:text-brand-lime">
                      {money(e.keyone)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      <FAQsTwoColumnAccordion id="faqs" headline="Pricing questions.">
        {pricingFaqs.map((f, i) => (
          <Faq key={f.q} id={`pricing-faq-${i + 1}`} question={f.q} answer={f.a} />
        ))}
      </FAQsTwoColumnAccordion>

      <StartFreeCallToAction />
    </Main>
  )
}
