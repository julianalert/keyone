import type { Metadata } from 'next'
import Image from 'next/image'
import { AnnouncementBadge } from '@/components/marketing/elements/announcement-badge'
import { ButtonLink, PlainButtonLink } from '@/components/marketing/elements/button'
import { Main } from '@/components/marketing/elements/main'
import { Screenshot } from '@/components/marketing/elements/screenshot'
import { Section } from '@/components/marketing/elements/section'
import { Wallpaper } from '@/components/marketing/elements/wallpaper'
import { AlertTriangleIcon } from '@/components/marketing/icons/alert-triangle-icon'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { BanknotesIcon } from '@/components/marketing/icons/banknotes-icon'
import { BellIcon } from '@/components/marketing/icons/bell-icon'
import { ChartLineIcon } from '@/components/marketing/icons/chart-line-icon'
import { CheckmarkIcon } from '@/components/marketing/icons/checkmark-icon'
import { DocumentIcon } from '@/components/marketing/icons/document-icon'
import { KeyIcon } from '@/components/marketing/icons/key-icon'
import { LightingBoltIcon } from '@/components/marketing/icons/lighting-bolt-icon'
import { RepeatIcon } from '@/components/marketing/icons/repeat-icon'
import { XIcon } from '@/components/marketing/icons/social/x-icon'
import { TerminalIcon } from '@/components/marketing/icons/terminal-icon'
import { CallToActionCenteredCard } from '@/components/marketing/sections/call-to-action-centered-card'
import { FAQsTwoColumnAccordion, Faq } from '@/components/marketing/sections/faqs-two-column-accordion'
import {
  Feature as CoreFeature,
  FeaturesStackedAlternatingWithDemos,
} from '@/components/marketing/sections/features-stacked-alternating-with-demos'
import { Feature, FeaturesThreeColumn } from '@/components/marketing/sections/features-three-column'
import { FeaturesWithLargeDemo, Feature as ProblemFeature } from '@/components/marketing/sections/features-with-large-demo'
import {
  FooterLink,
  FooterWithLinksAndSocialIcons,
  SocialLink,
} from '@/components/marketing/sections/footer-with-links-and-social-icons'
import { HeroLeftAlignedWithDemo } from '@/components/marketing/sections/hero-left-aligned-with-demo'
import {
  NavbarLink,
  NavbarLogo,
  NavbarWithLinksActionsAndCenteredLogo,
} from '@/components/marketing/sections/navbar-with-links-actions-and-centered-logo'
import { Stat, StatsThreeColumnWithDescription } from '@/components/marketing/sections/stats-three-column-with-description'
import { TestimonialLargeQuote } from '@/components/marketing/sections/testimonial-with-large-quote'
import { CatalogCard, getCatalog } from './catalog'
import { HeroDemo, KeySprawlDemo, KeysDemo, SpendDemo, StructureDemo } from './demos'

export const metadata: Metadata = {
  title: 'keyone — Stop managing API keys for every client',
  description:
    'For AI automation agencies: replace the dozens of provider keys you manage across clients with one account and one key per client project, with spend tracked and capped per client.',
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

const problems = [
  {
    title: 'A key for every tool, for every client',
    body: 'Each new client means a new OpenAI key, a new Anthropic key, a new Perplexity key, scattered across .env files, n8n credentials and Make connections. You manage all of them.',
    icon: <KeyIcon />,
  },
  {
    title: 'One bill, many clients',
    body: 'Every provider bills your agency for all your clients at once. Splitting it per client means spreadsheets, guesses, and a lost afternoon every month.',
    icon: <DocumentIcon />,
  },
  {
    title: 'No brakes per client',
    body: 'Provider limits apply to your whole account, not to one client. A single runaway loop can burn through a client’s budget before anyone looks.',
    icon: <AlertTriangleIcon />,
  },
]

const agitations = [
  { stat: '$400', text: 'burned overnight by one retry loop, on a client paying you a $300 retainer.' },
  { stat: '40+', text: 'keys to create, store, rotate and revoke once you run four tools for ten clients.' },
  { stat: '5', text: 'provider dashboards to open when a client asks what their AI actually cost.' },
]

const coreFeatures = [
  {
    eyebrow: 'Key management',
    benefit: 'Replace dozens of provider keys with one per client project.',
    body: 'Your agency stops managing a key per tool per client. Each client project gets one key that works across the whole catalog. Add Perplexity to a client’s workflow next week and nothing changes.',
    points: [
      'No provider accounts, cards or keys to set up for each client',
      'Onboard a client in a minute: create the project, copy the key',
      'Offboard a client, or rotate a leaked key, without touching anyone else',
      'Drop-in for the OpenAI and Anthropic SDKs: change the base URL and the key',
    ],
    demo: <KeysDemo />,
    wallpaper: 'green' as const,
  },
  {
    eyebrow: 'Spend management',
    benefit: 'Know what every client costs your agency, to the cent.',
    body: 'Every call is stamped with its client, project, tool, and model the moment it happens. No tagging, no month-end reconciliation.',
    points: [
      'Live spend per client, per project, per model',
      'Monthly budgets per client and per project',
      'Per-call caps and allowed tools and models, checked before the call runs',
      'Blocked calls return a clear reason your agent can read and explain',
    ],
    demo: <SpendDemo />,
    wallpaper: 'brown' as const,
  },
]

const moreFeatures = [
  {
    benefit: 'Sleep through the 2 AM loop',
    feature: 'Spike auto-freeze',
    body: 'When one client’s key suddenly spends many times its normal hourly rate, keyone freezes that key alone. Every other client keeps running.',
    icon: <LightingBoltIcon />,
  },
  {
    benefit: 'Hear about it before the client does',
    feature: 'Budget alerts',
    body: 'An email and a webhook at 50, 80 and 100% of every client and project budget. Once per threshold, not a flood.',
    icon: <BellIcon />,
  },
  {
    benefit: 'Say yes in one click',
    feature: 'Budget requests',
    body: 'When an agent needs more room it asks for it, with a reason. You approve or deny from the email. Small increases can approve themselves.',
    icon: <CheckmarkIcon />,
  },
  {
    benefit: 'Rebill with confidence, and keep your margin',
    feature: 'Client reports and CSV export',
    body: 'Set a markup per client and export line items ready to invoice. Cost, price, and rebill amount in every row.',
    icon: <DocumentIcon />,
  },
  {
    benefit: 'A FinOps reviewer you’d never hire',
    feature: 'Controller agent',
    body: 'Every morning it reviews spend, flags drift, premium models on trivial tasks, and idle budgets, and proposes the fix. Nothing changes until you click Apply.',
    icon: <ChartLineIcon />,
  },
  {
    benefit: 'Let your agents set themselves up',
    feature: 'MCP server and skill file',
    body: 'Claude Code, Cursor, or your own agent can create clients, mint project keys, and check spend through MCP. You stay in control of the limits.',
    icon: <TerminalIcon />,
  },
  {
    benefit: 'One wallet instead of five invoices',
    feature: 'Prepaid wallet',
    body: 'Top up once and spend across every provider, for every client. No card on file with each vendor, no surprise overage at month end.',
    icon: <BanknotesIcon />,
  },
  {
    benefit: 'Nothing to rebuild',
    feature: 'Streaming and SDK compatible',
    body: 'Streaming, tools, and provider headers pass straight through. Your existing code keeps working, now with a budget around it.',
    icon: <RepeatIcon />,
  },
]

const steps = [
  {
    n: '01',
    title: 'Add a client and a project',
    body: 'Mirror how you already work: Durand Construction → Quote generator. Set a monthly budget if you want one.',
  },
  {
    n: '02',
    title: 'Swap out the provider keys',
    body: 'In that client’s automations, replace the OpenAI, Anthropic and other keys with the one project key. Every tool in the catalog now runs on it.',
  },
  {
    n: '03',
    title: 'Run, watch, rebill',
    body: 'Spend lands on the right client in real time. At month end, export the CSV and send the invoice.',
  },
]

// Shown in the solution diagram if the live catalog can't be loaded
const fallbackTools = ['OpenAI', 'Anthropic', 'Perplexity', 'Google Maps via Apify', 'DataForSEO']

const faqs = [
  {
    q: 'Do I need my own provider accounts?',
    a: 'No. Keyone provides access to its supported catalogue through your agency account and prepaid wallet. Each client project gets its own Keyone API key.',
  },
  {
    q: 'Do my clients need to use Keyone?',
    a: 'No. Keyone is your agency’s workspace. You manage projects and usage; clients receive your service and your invoice.',
  },
  {
    q: 'What happens when a budget is reached?',
    a: 'Keyone checks configured limits before sending a call to the provider. Calls that exceed a limit are refused with a machine-readable reason. Budget alerts help you decide when to adjust a limit.',
  },
  {
    q: 'Does Keyone send invoices to my clients?',
    a: 'Keyone prepares client reports and CSV exports with your configured markup. You use those line items in your existing invoicing process.',
  },
  {
    q: 'Can I start with just one project?',
    a: 'Yes. Create one client project, connect a supported integration and run it through your wallet. You can add other projects when the setup works for your agency.',
  },
  {
    q: 'What if my clients pay providers directly?',
    a: 'Keyone’s current model uses an agency-funded wallet. If your clients must retain their own provider accounts and direct billing, that arrangement may be a better fit for them.',
  },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default async function HomePage() {
  const catalog = await getCatalog()
  const tools = catalog.length > 0 ? catalog.map(api => api.name) : fallbackTools

  return (
    <>
      <NavbarWithLinksActionsAndCenteredLogo
        id="navbar"
        links={
          <>
            <NavbarLink href="#features">Features</NavbarLink>
            <NavbarLink href="#how">How it works</NavbarLink>
            <NavbarLink href="#faqs">FAQ</NavbarLink>
            <NavbarLink href="/login" className="sm:hidden">
              Sign in
            </NavbarLink>
          </>
        }
        logo={
          <NavbarLogo href="/" aria-label="keyone home">
            <span className="font-display text-3xl/none tracking-tight text-olive-950 dark:text-white">
              keyone
            </span>
          </NavbarLogo>
        }
        actions={
          <>
            <PlainButtonLink href="/login" className="max-sm:hidden">
              Sign in
            </PlainButtonLink>
            <ButtonLink href="/signup">Start free</ButtonLink>
          </>
        }
      />

      <Main>
        {/* Hero */}
        <HeroLeftAlignedWithDemo
          id="hero"
          eyebrow={<AnnouncementBadge href="#how" text="For AI automation agencies" cta="See how it works" />}
          headline={
            <>
              Stop managing API keys for every client.{' '}
              <span className="text-brand-green italic dark:text-brand-lime">Know what each one costs you.</span>
            </>
          }
          subheadline={
            <p>
              Your agency runs AI for a dozen clients, on a handful of tools, with a key for every combination. keyone
              replaces them with one account and one key per client project, then tracks and caps the spend per client.
            </p>
          }
          cta={
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <ButtonLink href="/signup" size="lg">
                  Start free
                </ButtonLink>
                <PlainButtonLink href="#how" size="lg">
                  See how it works <ArrowNarrowRightIcon />
                </PlainButtonLink>
              </div>
              <p className="text-sm/7 text-olive-500">No provider accounts needed. Set up your first client in minutes.</p>
            </div>
          }
          demo={
            <Screenshot className="rounded-lg" wallpaper="green" placement="bottom">
              <HeroDemo />
            </Screenshot>
          }
        />

        {/* Testimonial */}
        <TestimonialLargeQuote
          id="testimonial"
          quote={
            <p>
              We run automations for a dozen construction companies, and I was managing a separate set of API keys for
              each of them, then rebuilding the AI bill by hand every month. Now it’s one account, one key per client
              project with a budget, and invoicing is an export.
            </p>
          }
          img={<Image src="/clement.jpg" alt="" width={96} height={96} />}
          name="Clement Bernard"
          byline={
            <>
              Founder,{' '}
              <a href="https://visionbds.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                Visionbds
              </a>{' '}
              · AI Automation Agency
            </>
          }
        />

        {/* Problem */}
        <FeaturesWithLargeDemo
          id="problem"
          eyebrow="The problem"
          headline="Ten clients in, your agency is managing a key for every tool, for every client."
          demo={
            <Screenshot className="rounded-lg" wallpaper="brown" placement="bottom-right">
              <KeySprawlDemo />
            </Screenshot>
          }
          features={problems.map(p => (
            <ProblemFeature key={p.title} icon={p.icon} headline={p.title} subheadline={<p>{p.body}</p>} />
          ))}
        />

        {/* Agitate */}
        <StatsThreeColumnWithDescription
          id="stakes"
          heading="Every new client multiplies the risk."
          description={
            <p>
              Every client you sign adds a key per tool to your pile, more workflows that can loop, and more cost you
              can’t attribute. You end up absorbing the overages, because you can’t prove which client caused them.
            </p>
          }
        >
          {agitations.map(a => (
            <Stat key={a.stat} stat={<span className="font-display text-5xl/14">{a.stat}</span>} text={a.text} />
          ))}
        </StatsThreeColumnWithDescription>

        {/* Solution */}
        <Section
          id="solution"
          eyebrow="The solution"
          headline="One account for your agency. One key per client project. Every tool behind it."
          subheadline={
            <p>
              keyone sits between your automations and the AI providers. You organize it by client and project, the way
              you already work, and every call is attributed to the right client and checked against its limits.
            </p>
          }
        >
          <Wallpaper color="green" className="rounded-lg p-4 sm:p-10">
            <div className="overflow-hidden rounded-sm ring-1 ring-black/10">
              <StructureDemo tools={tools} />
            </div>
          </Wallpaper>
        </Section>

        {/* Core features */}
        <FeaturesStackedAlternatingWithDemos
          id="features"
          eyebrow="The core"
          headline="Keys and spend, handled."
          features={coreFeatures.map(f => (
            <CoreFeature
              key={f.eyebrow}
              headline={f.benefit}
              subheadline={<p>{f.body}</p>}
              cta={
                <ul className="flex flex-col gap-3 text-sm/6 text-olive-950 dark:text-white">
                  {f.points.map(p => (
                    <li key={p} className="flex items-start gap-3">
                      <CheckmarkIcon className="mt-1.5 shrink-0 text-brand-green dark:text-brand-lime" />
                      {p}
                    </li>
                  ))}
                </ul>
              }
              demo={
                <Screenshot className="h-full" wallpaper={f.wallpaper} placement="bottom-right">
                  {f.demo}
                </Screenshot>
              }
            />
          ))}
        />

        {/* More features */}
        <FeaturesThreeColumn
          id="more-features"
          eyebrow="Everything around it"
          headline="Built for agencies running AI for other people’s businesses."
          features={moreFeatures.map(f => (
            <Feature
              key={f.feature}
              icon={f.icon}
              headline={f.benefit}
              subheadline={
                <p>
                  <span className="font-medium text-olive-950 dark:text-white">{f.feature}.</span> {f.body}
                </p>
              }
            />
          ))}
        />

        {/* How it works */}
        <Section id="how" eyebrow="How it works" headline="Live in minutes.">
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {steps.map(s => (
                <div key={s.n} className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5">
                  <p className="font-display text-4xl/10 text-brand-green dark:text-brand-lime">{s.n}</p>
                  <h3 className="mt-4 text-base/7 font-medium text-olive-950 dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm/7 text-olive-700 dark:text-olive-400">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-4">
              <p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">In the catalog today</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {catalog.map(api => (
                  <CatalogCard key={api.slug} api={api} />
                ))}
                <div className="flex items-center justify-center rounded-xl p-6 text-sm/7 text-olive-500 outline-1 -outline-offset-1 outline-olive-950/10 outline-dashed dark:outline-white/10">
                  More tools every month
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* FAQs */}
        <FAQsTwoColumnAccordion id="faqs" headline="Questions agencies ask.">
          {faqs.map((f, i) => (
            <Faq key={f.q} id={`faq-${i + 1}`} question={f.q} answer={f.a} />
          ))}
        </FAQsTwoColumnAccordion>

        {/* Call To Action */}
        <CallToActionCenteredCard
          id="call-to-action"
          headline={
            <>
              Fewer keys to manage.
              <br />
              <span className="text-brand-lime italic">Every client’s AI spend under control.</span>
            </>
          }
          subheadline={
            <p>
              Set up your first client and project in minutes. Your automations keep running, now with budgets and a clean
              invoice at the end of the month.
            </p>
          }
          cta={
            <ButtonLink href="/signup" size="lg" color="light">
              Start free
            </ButtonLink>
          }
        />
      </Main>

      <FooterWithLinksAndSocialIcons
        id="footer"
        links={
          <>
            <FooterLink href="#features">Features</FooterLink>
            <FooterLink href="#how">How it works</FooterLink>
            <FooterLink href="#faqs">FAQ</FooterLink>
            <FooterLink href="/login">Sign in</FooterLink>
            <FooterLink href="/signup">Sign up</FooterLink>
          </>
        }
        socialLinks={
          <SocialLink href="https://x.com/notanothermrktr" name="X">
            <XIcon />
          </SocialLink>
        }
        fineprint={<>© {new Date().getFullYear()} keyone · API keys and AI spend for agencies, organized by client.</>}
      />
    </>
  )
}
