import type { Metadata } from 'next'
import { Main } from '@/components/marketing/elements/main'
import { DocumentCentered } from '@/components/marketing/sections/document-centered'
import { COMPANY_NAME, CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '../company'
import { pageMetadata } from '../seo'

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description: 'What personal data keyone collects, how it is used and shared, and the rights you have over it.',
  path: '/privacy',
})

export default function PrivacyPage() {
  const operator = LEGAL_ENTITY ?? COMPANY_NAME

  return (
    <Main>
      <DocumentCentered id="privacy" headline="Privacy Policy" subheadline={<p>Last updated on {LEGAL_LAST_UPDATED}.</p>}>
        <p>
          This policy explains what information {operator} (“<strong>keyone</strong>,” “<strong>we</strong>” or “
          <strong>us</strong>”) collects when you use getkeyone.com, the keyone dashboard and the keyone API
          (together, the “<strong>Service</strong>”), how we use it and the choices you have.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account information:</strong> your name, email address and password (stored by our authentication
            provider, never in plain text), your agency name, and the teammates you invite.
          </li>
          <li>
            <strong>Workspace information:</strong> the clients, projects, budgets, limits, alert settings and webhook
            URLs you configure.
          </li>
          <li>
            <strong>API usage:</strong> for every call made through keyone, the time, client, project, key, tool, model,
            token counts or results, cost and status, and the request body you send (such as prompts and parameters),
            with credential fields redacted. We do not store the providers’ responses.
          </li>
          <li>
            <strong>Payments:</strong> wallet top-ups are processed by Stripe. We never receive or store your full card
            details; we keep a record of each transaction.
          </li>
          <li>
            <strong>Technical information:</strong> cookies that keep you signed in, fraud-prevention cookies set by
            Stripe on the payment page, and request counters per key used
            for rate limiting. We measure page views on our website and dashboard with Simple Analytics, which does not use
            cookies or collect personal data. We do not use advertising or tracking cookies.
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To run the Service: route your calls, enforce your budgets and limits, and charge your wallet.</li>
          <li>To show you spend reports, exports and controller findings, and to send alerts, receipts and account emails.</li>
          <li>To keep the Service secure, prevent abuse and investigate problems.</li>
          <li>To answer your support requests and meet our legal, tax and accounting obligations.</li>
        </ul>

        <h2>Who we share it with</h2>
        <p>
          <strong>AI and data providers.</strong> When you call a tool through keyone, we forward your request to that
          tool’s provider (for example OpenAI, Anthropic, Perplexity, Apify or DataForSEO) so it can be fulfilled. Each
          provider processes it under its own terms and privacy policy.
        </p>
        <p>
          <strong>Service providers.</strong> We rely on Supabase (database and authentication), Vercel (hosting),
          Stripe (payments), Resend (email), Upstash (rate limiting) and Simple Analytics (privacy-first website
          analytics). The controller agent sends your spend findings,
          including client and project names, to Anthropic to write its daily summary; it does not send your requests.
        </p>
        <p>We do not sell your personal information.</p>

        <h2>How long we keep it</h2>
        <p>
          We keep account, workspace and usage records while your account is active, and afterwards for as long as we
          need them for billing, legal and accounting purposes. You can ask us to delete your account and its data at
          any time, subject to those obligations.
        </p>

        <h2>Your rights</h2>
        <p>
          Depending on where you live, including in the European Union under the GDPR, you can ask to access, correct,
          export or delete your personal data, or object to or restrict how we process it. Email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will reply within one business day. You can
          also complain to your data protection authority; in France, that is the CNIL.
        </p>

        <h2>Security</h2>
        <p>
          Connections to keyone are encrypted, project keys are stored as hashes rather than in readable form, and access
          to your workspace is limited to your agency’s members. No system is perfectly secure, so keep your keys private
          and revoke any key you think has been exposed.
        </p>

        <h2>Changes and contact</h2>
        <p>
          We will update this page when our practices change and revise the date above. For any question about this
          policy, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </DocumentCentered>
    </Main>
  )
}
