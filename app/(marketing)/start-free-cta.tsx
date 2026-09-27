import { ButtonLink } from '@/components/marketing/elements/button'
import { CallToActionCenteredCard } from '@/components/marketing/sections/call-to-action-centered-card'

export function StartFreeCallToAction() {
  return (
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
  )
}
