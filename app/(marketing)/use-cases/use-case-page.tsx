import { ButtonLink, PlainButtonLink } from '@/components/marketing/elements/button'
import { Main } from '@/components/marketing/elements/main'
import { Screenshot } from '@/components/marketing/elements/screenshot'
import { Section } from '@/components/marketing/elements/section'
import { Wallpaper } from '@/components/marketing/elements/wallpaper'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { CheckmarkIcon } from '@/components/marketing/icons/checkmark-icon'
import { FAQsTwoColumnAccordion, Faq } from '@/components/marketing/sections/faqs-two-column-accordion'
import {
  Feature as SolutionFeature,
  FeaturesStackedAlternatingWithDemos,
} from '@/components/marketing/sections/features-stacked-alternating-with-demos'
import { Feature, FeaturesThreeColumn } from '@/components/marketing/sections/features-three-column'
import { HeroLeftAlignedWithDemo } from '@/components/marketing/sections/hero-left-aligned-with-demo'
import { Stat, StatsThreeColumnWithDescription } from '@/components/marketing/sections/stats-three-column-with-description'
import { GuideCard } from '../guides/guide-card'
import { getAllGuides } from '../guides/guides'
import { productPages } from '../product/pages'
import { SITE_URL } from '../seo'
import { StartFreeCallToAction } from '../start-free-cta'
import { WorkspaceDemo } from './demos'
import { UseCaseGrid } from './use-case-grid'
import { useCases, type UseCaseContent } from './use-cases'

// Shared layout of every use-case page, same PAS order as the product pages:
// hero, Problem, Agitate, Solution, how it works, what to read next, FAQ.
export function UseCasePage({ page }: { page: UseCaseContent }) {
  const guide = page.guideSlug ? getAllGuides().find(g => g.slug === page.guideSlug) : undefined
  const products = page.productSlugs.map(slug => productPages.find(p => p.slug === slug)).filter(Boolean) as typeof productPages
  const others = useCases.filter(u => u.slug !== page.slug)

  return (
    <Main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
                { '@type': 'ListItem', position: 2, name: 'Use cases', item: `${SITE_URL}/use-cases` },
                { '@type': 'ListItem', position: 3, name: page.name, item: `${SITE_URL}/use-cases/${page.slug}` },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: page.faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]).replace(/</g, '\\u003c'),
        }}
      />

      {/* Hero */}
      <HeroLeftAlignedWithDemo
        id="hero"
        eyebrow={
          <p className="inline-flex items-center gap-2 text-sm/7 font-semibold text-brand-green dark:text-brand-lime">
            {page.icon} For {page.audience}
          </p>
        }
        headline={
          <>
            {page.headline} <span className="text-brand-green italic dark:text-brand-lime">{page.accent}</span>
          </>
        }
        subheadline={<p>{page.subheadline}</p>}
        cta={
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <ButtonLink href="/signup" size="lg">
                Start with one client project (free)
              </ButtonLink>
              <PlainButtonLink href="#solution" size="lg">
                See how it works <ArrowNarrowRightIcon />
              </PlainButtonLink>
            </div>
            <p className="text-sm/7 text-olive-500">No monthly subscription. Add funds when you’re ready to run.</p>
          </div>
        }
        demo={
          <Wallpaper color={page.wallpaper} className="rounded-lg p-3 sm:p-8">
            <div className="overflow-hidden rounded-md ring-1 ring-black/10">
              <WorkspaceDemo {...page.workspace} />
            </div>
          </Wallpaper>
        }
      />

      {/* Problem */}
      <FeaturesThreeColumn
        id="problem"
        eyebrow="Sound familiar?"
        headline={page.problem.headline}
        features={page.problem.items.map(item => (
          <Feature key={item.title} icon={item.icon} headline={item.title} subheadline={<p>{item.body}</p>} />
        ))}
      />

      {/* Agitate */}
      <StatsThreeColumnWithDescription id="stakes" heading={page.agitate.headline} description={<p>{page.agitate.body}</p>}>
        {page.agitate.stats.map(s => (
          <Stat key={s.stat + s.text} stat={<span className="font-display text-5xl/14">{s.stat}</span>} text={s.text} />
        ))}
      </StatsThreeColumnWithDescription>

      {/* Solution */}
      <FeaturesStackedAlternatingWithDemos
        id="solution"
        eyebrow="How keyone fits"
        headline={page.solution.headline}
        subheadline={<p>{page.solution.subheadline}</p>}
        features={page.solution.features.map(f => (
          <SolutionFeature
            key={f.title}
            headline={f.title}
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

      <FeaturesThreeColumn
        id="more"
        className="pt-0"
        features={page.solution.extras.map(e => (
          <Feature key={e.title} icon={e.icon} headline={e.title} subheadline={<p>{e.body}</p>} />
        ))}
      />

      {/* How it works */}
      <Section id="how" eyebrow="How it works" headline="Live in minutes.">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          {page.steps.map((step, i) => (
            <div key={step.title} className="rounded-xl bg-olive-950/2.5 p-6 dark:bg-white/5">
              <p className="font-display text-4xl/10 text-brand-green dark:text-brand-lime">0{i + 1}</p>
              <h3 className="mt-4 text-base/7 font-medium text-olive-950 dark:text-white">{step.title}</h3>
              <p className="mt-2 text-sm/7 text-olive-700 dark:text-olive-400">{step.body}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* What this reader will use most, plus the matching guide */}
      <Section id="related" eyebrow="What you’ll use most" headline="The parts of keyone built for this.">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {guide && (
            <div className="flex">
              <GuideCard guide={guide} headingLevel="h3" />
            </div>
          )}
          <ul className={guide ? 'grid grid-cols-1 gap-2 sm:grid-cols-3 lg:col-span-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-3 lg:col-span-3'}>
            {products.map(p => (
              <li key={p.slug} className="flex">
                <a
                  href={`/product/${p.slug}`}
                  className="group flex flex-1 flex-col gap-2 rounded-xl bg-olive-950/2.5 p-6 hover:bg-olive-950/5 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand-lime/20 text-brand-green dark:bg-brand-lime/15 dark:text-brand-lime">
                    {p.icon}
                  </span>
                  <h3 className="mt-2 text-base/7 font-medium text-olive-950 dark:text-white">{p.name}</h3>
                  <p className="flex-1 text-sm/7 text-olive-700 dark:text-olive-400">{p.tagline}</p>
                  <span className="inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 dark:text-white">
                    Learn more <ArrowNarrowRightIcon className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <FAQsTwoColumnAccordion id="faqs" headline={`Questions ${page.audience} ask.`}>
        {page.faqs.map((f, i) => (
          <Faq key={f.q} id={`${page.slug}-faq-${i + 1}`} question={f.q} answer={f.a} />
        ))}
      </FAQsTwoColumnAccordion>

      {/* Other use cases */}
      <Section
        id="other-use-cases"
        eyebrow="Other use cases"
        headline="Not quite you?"
        cta={
          <PlainButtonLink href="/use-cases" className="self-start">
            All use cases <ArrowNarrowRightIcon />
          </PlainButtonLink>
        }
      >
        <UseCaseGrid items={others} columns={3} />
      </Section>

      <StartFreeCallToAction />
    </Main>
  )
}
