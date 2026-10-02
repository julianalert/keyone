import { ButtonLink } from '@/components/marketing/elements/button'
import { Main } from '@/components/marketing/elements/main'
import { Section } from '@/components/marketing/elements/section'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { CallToActionCenteredCard } from '@/components/marketing/sections/call-to-action-centered-card'
import { HeroSimpleCentered } from '@/components/marketing/sections/hero-simple-centered'
import { CONTACT_EMAIL } from '../company'
import { pageMetadata } from '../seo'

export const metadata = pageMetadata({
  title: 'Careers',
  description:
    'Careers at keyone. All current roles are filled; send us a note if you want to help agencies run AI for their clients.',
  path: '/careers',
})

// Roles shown on the page. `open: false` renders the role as filled.
const positions = [
  { title: 'Head of Product', team: 'Product', open: false },
  { title: 'Growth Manager', team: 'Growth', open: false },
  { title: 'UX Designer', team: 'Design', open: false },
]

export default function CareersPage() {
  const openCount = positions.filter(p => p.open).length

  return (
    <Main>
      <HeroSimpleCentered
        id="hero"
        eyebrow={<p className="text-sm/7 font-semibold text-olive-700 dark:text-olive-400">Careers</p>}
        headline={
          <>
            Help agencies run AI <span className="text-brand-green italic dark:text-brand-lime">for their clients.</span>
          </>
        }
        subheadline={
          <p>
            keyone is a small team building the account, the keys and the spend controls agencies need to run AI for
            other people’s businesses.
          </p>
        }
      />

      <Section
        id="positions"
        eyebrow="Positions"
        headline={openCount > 0 ? 'Open roles.' : 'All current roles are filled.'}
        subheadline={
          <p>
            {openCount > 0
              ? 'Pick a role below to apply.'
              : 'We are not hiring for a specific role right now. New positions will be listed here.'}
          </p>
        }
      >
        <ul className="overflow-hidden rounded-xl bg-white ring-1 ring-olive-950/10 dark:bg-white/5 dark:ring-white/10">
          {positions.map(position => (
            <li
              key={position.title}
              className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-olive-950/10 px-6 py-5 first:border-t-0 dark:border-white/10"
            >
              <div className="flex flex-col">
                <h3
                  className={
                    position.open
                      ? 'text-base/7 font-medium text-olive-950 dark:text-white'
                      : 'text-base/7 font-medium text-olive-500'
                  }
                >
                  {position.title}
                </h3>
                <p className="text-sm/6 text-olive-500">{position.team}</p>
              </div>
              {position.open ? (
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(position.title)}`}
                  className="inline-flex items-center gap-2 text-sm/7 font-medium text-olive-950 dark:text-white"
                >
                  Apply <ArrowNarrowRightIcon />
                </a>
              ) : (
                <span className="rounded-full bg-olive-950/5 px-3 py-0.5 text-sm/7 text-olive-600 dark:bg-white/10 dark:text-olive-400">
                  Position filled
                </span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <CallToActionCenteredCard
        id="call-to-action"
        headline={
          <>
            Don’t see your role?
            <br />
            <span className="text-brand-lime italic">Write to us anyway.</span>
          </>
        }
        subheadline={<p>Tell us what you would build at keyone and why. We read every message.</p>}
        cta={
          <ButtonLink href={`mailto:${CONTACT_EMAIL}?subject=Working%20at%20keyone`} size="lg" color="light">
            {CONTACT_EMAIL}
          </ButtonLink>
        }
      />
    </Main>
  )
}
