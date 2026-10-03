import { ButtonLink } from '@/components/marketing/elements/button'
import { ArrowNarrowRightIcon } from '@/components/marketing/icons/arrow-narrow-right-icon'
import { CallToActionCenteredCard } from '@/components/marketing/sections/call-to-action-centered-card'

export function StartFreeCallToAction() {
  return (
    <CallToActionCenteredCard
      id="call-to-action"
      headline={
        <>
          Pick one client.
          <br />
          <span className="text-brand-lime italic">Know what their AI costs.</span>
        </>
      }
      subheadline={<p>Connect a project, set its budget, and see its usage in one place.</p>}
      cta={
        <div className="flex flex-col items-center gap-4">
          <ButtonLink href="/signup" size="lg" color="light">
            Start with one client project <ArrowNarrowRightIcon />
          </ButtonLink>
          <p className="text-sm/7 text-olive-400">
            No monthly subscription. Add funds when you’re ready to run.{' '}
            <a href="/demo" className="font-medium whitespace-nowrap text-white underline">
              Or book a demo
            </a>
          </p>
        </div>
      }
    />
  )
}
