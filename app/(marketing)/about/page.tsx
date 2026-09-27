import type { Metadata } from 'next'
import Image from 'next/image'
import { ButtonLink, PlainButtonLink } from '@/components/marketing/elements/button'
import { Container } from '@/components/marketing/elements/container'
import { Main } from '@/components/marketing/elements/main'
import { Section } from '@/components/marketing/elements/section'
import { Subheading } from '@/components/marketing/elements/subheading'
import { Text } from '@/components/marketing/elements/text'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { BellIcon } from '@/components/marketing/icons/bell-icon'
import { ChartLineIcon } from '@/components/marketing/icons/chart-line-icon'
import { CheckmarkIcon } from '@/components/marketing/icons/checkmark-icon'
import { DocumentIcon } from '@/components/marketing/icons/document-icon'
import { KeyIcon } from '@/components/marketing/icons/key-icon'
import { SlidersIcon } from '@/components/marketing/icons/sliders-icon'
import { TerminalIcon } from '@/components/marketing/icons/terminal-icon'
import { Feature, FeaturesThreeColumn } from '@/components/marketing/sections/features-three-column'
import { HeroTwoColumnWithPhoto } from '@/components/marketing/sections/hero-two-column-with-photo'
import { appUrl } from '@/lib/config'
import { getCatalog } from '../catalog'
import { CONTACT_EMAIL } from '../company'
import { faqs } from '../faqs'
import { StartFreeCallToAction } from '../start-free-cta'

// Regenerate hourly so the catalog names stay current
export const revalidate = 3600

export const metadata: Metadata = {
  title: 'About keyone | API keys and AI spend for agencies',
  description:
    'keyone is an AI spend management platform that gives AI automation agencies one API key per client project, with every client’s spend tracked and capped.',
  alternates: { canonical: '/about' },
}

const SITE = appUrl('https://getkeyone.com')

const founders = [
  {
    name: 'Julien Devoir',
    role: 'Founder',
    img: '/julian.jpg',
    story:
      'Julien runs a marketing agency whose clients each have several AI projects. Managing a provider key for every tool and client, then rebuilding the AI bill by hand, is what led him to build keyone.',
    links: [{ label: 'LinkedIn', href: 'https://www.linkedin.com/in/juliendevoir/' }],
  },
  {
    name: 'Carine',
    role: 'Co-founder',
    img: '/carine.jpeg',
    story: 'Carine co-founded keyone and writes its guides on running AI for clients, from tracking costs to billing usage.',
    links: [{ label: 'Guides', href: '/guides' }],
  },
]

const services = [
  {
    title: 'One API key per client project',
    body: 'Each client project gets one keyone key that works across the whole catalog. Your agency stops creating and storing a provider key for every tool and every client.',
    icon: <KeyIcon />,
  },
  {
    title: 'Spend tracking per client',
    body: 'Every call is recorded against its client, project, tool and model as it happens. You know what each client costs without tagging or month-end reconciliation.',
    icon: <ChartLineIcon />,
  },
  {
    title: 'Budgets and spend controls',
    body: 'Set monthly budgets per client and per project, per-call caps, and allowed tools and models. keyone checks them before the call reaches the provider, so nothing is charged past a limit.',
    icon: <SlidersIcon />,
  },
  {
    title: 'Alerts and spike auto-freeze',
    body: 'Email and webhook alerts fire at 50, 80 and 100% of each budget. When one key suddenly spends many times its normal hourly rate, keyone freezes that key alone.',
    icon: <BellIcon />,
  },
  {
    title: 'Client reports and CSV exports',
    body: 'Set a markup per client and export line items ready for your invoicing. keyone prepares the reports; your agency sends the invoice.',
    icon: <DocumentIcon />,
  },
  {
    title: 'Controller agent and MCP server',
    body: 'A controller agent reviews spend every morning and proposes fixes you approve. Claude Code, Cursor or your own agents can create clients, mint project keys and check spend through keyone’s MCP server.',
    icon: <TerminalIcon />,
  },
]

const differentiators = [
  {
    title: 'Every tool behind one key, not just LLMs',
    body: 'Gateways such as Portkey, Helicone and LiteLLM are built around LLM providers. A keyone key also covers search and data APIs, so a single key runs an entire client automation.',
  },
  {
    title: 'Organised by client and project',
    body: 'keyone models your agency directly: clients, their projects and one key per project, so spend rolls up per client with no tagging. Monid offers workspace budgets but has no client or project layer.',
  },
  {
    title: 'No provider accounts to set up',
    body: 'With LiteLLM you host the proxy yourself and bring a key for each provider. keyone holds provider access: your agency funds one prepaid wallet and every client project can use every tool in the catalog.',
  },
  {
    title: 'Limits enforced before the call',
    body: 'Budgets, per-call caps and allowed models are checked before a request reaches the provider. A blocked call returns a 403 with the limit, the amount spent and when it resets, so your agent can explain it.',
  },
  {
    title: 'No subscription or contract',
    body: 'You pay for usage from a prepaid wallet, starting with a $3 credit at signup and top-ups from $5. There is no monthly seat fee and no annual commitment.',
  },
]

const segments = [
  'AI automation agencies running workflows for several clients on n8n, Make or custom code.',
  'Marketing agencies adding AI features, such as content, research and reporting, to client retainers.',
  'Freelance automation builders who manage provider access for more than one client.',
  'Agency developers who let coding agents such as Claude Code or Cursor set up and run client projects.',
]

const onboarding = [
  { title: 'Sign up', body: 'Create your agency account and get a $3 credit to test with. No card needed to start.' },
  {
    title: 'Add a client and a project',
    body: 'Mirror how you already work, set a monthly budget if you want one, and copy the project key.',
  },
  {
    title: 'Swap the key in your automation',
    body: 'Change the base URL and the key in your OpenAI or Anthropic SDK. Streaming, tools and provider headers pass through unchanged.',
  },
]

function keyFacts(tools: string[]) {
  return [
    { label: 'Company name', value: 'keyone' },
    { label: 'Type', value: 'AI spend management and API access platform (software as a service)' },
    { label: 'Founded', value: '2026' },
    { label: 'Founders', value: 'Julien Devoir (founder), Carine (co-founder)' },
    { label: 'Headquarters', value: 'France' },
    { label: 'Website', value: <a href={SITE}>{SITE.replace(/^https?:\/\//, '')}</a> },
    {
      label: 'Core offering',
      value: 'One API key per client project for every tool in the catalog, with spend tracked, budgeted and capped per client',
    },
    {
      label: 'Pricing',
      value: 'Pay as you go from a prepaid wallet, per token, per call or per result depending on the tool; $3 credit at signup; top-ups from $5',
    },
    { label: 'Contract terms', value: 'No subscription and no contract' },
    {
      label: 'Services',
      value: 'Client and project API keys, per-client spend tracking, budgets and spend controls, alerts and auto-freeze, client reports and CSV exports, controller agent, MCP server',
    },
    { label: 'Catalog', value: tools.join(', ') },
    {
      label: 'Communication',
      value: (
        <>
          Email support at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, reply within one business day
        </>
      ),
    },
    { label: 'Notable clients', value: 'Visionbds (AI automation agency)' },
    { label: 'Competitors', value: 'Portkey, Helicone, LiteLLM, Monid' },
    {
      label: 'Social',
      value: (
        <>
          <a href="https://www.linkedin.com/in/juliendevoir/">LinkedIn (Julien Devoir)</a>,{' '}
          <a href="https://x.com/notanothermrktr">X (@notanothermrktr)</a>
        </>
      ),
    },
  ]
}

function structuredData() {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'keyone',
      url: SITE,
      foundingDate: '2026',
      foundingLocation: { '@type': 'Place', address: { '@type': 'PostalAddress', addressCountry: 'FR' } },
      founder: founders.map(f => ({ '@type': 'Person', name: f.name, jobTitle: f.role })),
      email: CONTACT_EMAIL,
      sameAs: ['https://x.com/notanothermrktr'],
      description:
        'keyone is an AI spend management platform that gives AI automation agencies one API key per client project, with every client’s spend tracked and capped.',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]
}

export default async function AboutPage() {
  const catalog = await getCatalog()
  const tools =
    catalog.length > 0
      ? catalog.map(api => api.name)
      : ['OpenAI', 'Anthropic', 'Perplexity', 'Google Maps via Apify', 'DataForSEO']

  return (
    <Main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c') }}
      />

      {/* Hero: the value proposition in one sentence */}
      <HeroTwoColumnWithPhoto
        id="hero"
        eyebrow={<p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">About keyone</p>}
        headline="The API key and spend manager for AI agencies."
        subheadline={
          <p>
            keyone is an AI spend management platform that gives AI automation agencies one API key per client project,
            for every tool in its catalog, and tracks and caps each client’s spend.
          </p>
        }
        cta={
          <div className="flex items-center gap-4">
            <ButtonLink href="/signup" size="lg">
              Start free
            </ButtonLink>
            <PlainButtonLink href="#key-facts" size="lg">
              Key facts <ArrowNarrowRightIcon />
            </PlainButtonLink>
          </div>
        }
        photo={
          <Image
            src="/about/hero.webp"
            alt=""
            width={1800}
            height={945}
            priority
            className="size-full not-dark:bg-white/75 dark:bg-black/75"
          />
        }
      />

      {/* What keyone does */}
      <FeaturesThreeColumn
        id="what-keyone-does"
        eyebrow="Product"
        headline="What keyone does"
        subheadline={
          <p>
            keyone sits between your agency’s automations and the providers in its catalog: {tools.join(', ')}.
          </p>
        }
        features={services.map(s => (
          <Feature key={s.title} icon={s.icon} headline={s.title} subheadline={<p>{s.body}</p>} />
        ))}
      />

      {/* What makes keyone different */}
      <Section id="what-makes-keyone-different" eyebrow="Why keyone" headline="What makes keyone different">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
          {differentiators.map((d, i) => (
            <div key={d.title} className="flex flex-col gap-3 rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5">
              <p className="font-display text-3xl/9 text-brand-green dark:text-brand-lime">0{i + 1}</p>
              <h3 className="text-base/7 font-medium text-olive-950 dark:text-white">{d.title}</h3>
              <p className="text-sm/7 text-olive-700 dark:text-olive-400">{d.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Who uses keyone */}
      <Section id="who-uses-keyone" eyebrow="Customers" headline="Who uses keyone">
        <ul className="grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2">
          {segments.map(s => (
            <li key={s} className="flex items-start gap-3 text-base/7 text-olive-950 dark:text-white">
              <CheckmarkIcon className="mt-2 shrink-0 text-brand-green dark:text-brand-lime" />
              {s}
            </li>
          ))}
        </ul>
      </Section>

      {/* The team behind keyone */}
      <Section
        id="team"
        eyebrow="Team"
        headline="The team behind keyone"
        subheadline={
          <p>
            keyone started in 2026 inside Julien’s agency, as the tool he needed to stop juggling provider keys across
            clients. It is built in France and led by its two co-founders.
          </p>
        }
      >
        <ul role="list" className="grid grid-cols-1 gap-10 md:grid-cols-2">
          {founders.map(f => (
            <li key={f.name} className="flex items-start gap-5">
              <Image
                src={f.img}
                alt={f.name}
                width={160}
                height={160}
                className="size-20 shrink-0 rounded-full object-cover outline -outline-offset-1 outline-black/5 not-dark:bg-white/75 dark:bg-black/75 dark:outline-white/10"
              />
              <div className="flex flex-col gap-1 text-sm/7">
                <h3 className="text-base/7 font-semibold text-olive-950 dark:text-white">{f.name}</h3>
                <p className="font-medium text-brand-green dark:text-brand-lime">{f.role}</p>
                <p className="mt-1 text-olive-700 dark:text-olive-400">{f.story}</p>
                {f.links.map(l => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="mt-1 inline-flex items-center gap-2 self-start font-medium text-olive-950 dark:text-white"
                  >
                    {l.label} <ArrowNarrowRightIcon />
                  </a>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </Section>

      {/* How keyone works */}
      <Section
        id="how-keyone-works"
        eyebrow="Working with us"
        headline="How keyone works"
        subheadline={
          <p>
            Onboarding is self-serve and takes minutes. For anything else, email the team at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-olive-950 underline decoration-brand-lime underline-offset-4 dark:text-white">
              {CONTACT_EMAIL}
            </a>
            : we reply within one business day.
          </p>
        }
      >
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {onboarding.map((step, i) => (
            <div key={step.title} className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5">
              <p className="font-display text-4xl/10 text-brand-green dark:text-brand-lime">0{i + 1}</p>
              <h3 className="mt-4 text-base/7 font-medium text-olive-950 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm/7 text-olive-700 dark:text-olive-400">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Key facts: a crawlable table for search engines and AI assistants */}
      <section id="key-facts" className="py-16">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">At a glance</p>
            <Subheading>Key facts</Subheading>
          </div>
          <div className="overflow-hidden rounded-xl bg-white ring-1 ring-olive-950/10 dark:bg-white/5 dark:ring-white/10">
            <table className="w-full text-sm/7">
              <tbody className="divide-y divide-olive-950/10 dark:divide-white/10">
                {keyFacts(tools).map(fact => (
                  <tr key={fact.label} className="max-sm:flex max-sm:flex-col max-sm:py-3">
                    <th
                      scope="row"
                      className="bg-olive-950/2.5 px-6 text-left align-top font-semibold whitespace-nowrap text-olive-950 sm:w-56 sm:py-3 dark:bg-white/5 dark:text-white max-sm:bg-transparent"
                    >
                      {fact.label}
                    </th>
                    <td className="px-6 text-olive-700 sm:py-3 dark:text-olive-300 [&_a]:font-medium [&_a]:text-olive-950 [&_a]:underline [&_a]:decoration-brand-lime [&_a]:underline-offset-4 dark:[&_a]:text-white">
                      {fact.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* Frequently asked questions */}
      <section id="faq" className="py-16">
        <Container className="grid grid-cols-1 gap-x-2 gap-y-8 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Subheading>Frequently asked questions</Subheading>
            <Text className="text-pretty">
              <p>
                Still have a question? Email{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-olive-950 underline decoration-brand-lime underline-offset-4 dark:text-white">
                  {CONTACT_EMAIL}
                </a>{' '}
                and we’ll reply within one business day.
              </p>
            </Text>
          </div>
          <div className="divide-y divide-olive-950/10 border-y border-olive-950/10 dark:divide-white/10 dark:border-white/10">
            {faqs.map(f => (
              <div key={f.q} className="py-5">
                <h3 className="text-base/7 font-medium text-olive-950 dark:text-white">{f.q}</h3>
                <p className="mt-2 text-sm/7 text-olive-700 dark:text-olive-400">{f.a}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <StartFreeCallToAction />
    </Main>
  )
}
