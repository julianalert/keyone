import type { Metadata } from 'next'
import { Main } from '@/components/marketing/elements/main'
import { DocumentCentered } from '@/components/marketing/sections/document-centered'
import { COMPANY_NAME, CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_LAST_UPDATED } from '../company'
import { pageMetadata } from '../seo'

export const metadata: Metadata = pageMetadata({
  title: 'Terms & Conditions',
  description: 'The terms that apply when your agency uses keyone: accounts, the prepaid wallet, acceptable use and liability.',
  path: '/terms',
})

export default function TermsPage() {
  const operator = LEGAL_ENTITY ?? COMPANY_NAME

  return (
    <Main>
      <DocumentCentered
        id="terms"
        headline="Terms & Conditions"
        subheadline={<p>Last updated on {LEGAL_LAST_UPDATED}.</p>}
      >
        <p>
          These terms govern your use of getkeyone.com, the keyone dashboard and the keyone API (together, the “
          <strong>Service</strong>”), provided by {operator} (“<strong>keyone</strong>,” “<strong>we</strong>” or “
          <strong>us</strong>”). By creating an account or using the Service, you agree to them on behalf of yourself and
          your agency.
        </p>

        <h2>The Service</h2>
        <p>
          keyone gives your agency one account and one API key per client project for the tools in its catalog, and
          tracks, budgets and limits the spend of each client and project. The tools themselves are operated by third-party
          providers, and their availability, features and prices can change.
        </p>

        <h2>Your account</h2>
        <ul>
          <li>You must give accurate information and keep your password and API keys confidential.</li>
          <li>
            You are responsible for everything done with your account and keys, including by the teammates, automations
            and agents you give access to.
          </li>
          <li>Revoke any key you believe has been exposed; you remain responsible for usage made with it until you do.</li>
        </ul>

        <h2>Prepaid wallet and pricing</h2>
        <ul>
          <li>
            Usage is paid from your agency’s prepaid wallet, per token, per call or per result depending on the tool, at
            the prices shown in the dashboard. Every API response states what the call cost.
          </li>
          <li>Top-ups are processed by Stripe. Welcome credit is promotional and has no cash value.</li>
          <li>
            Budgets and limits are checked before each call. You are responsible for configuring them to suit your
            clients.
          </li>
          <li>For refund requests or billing questions, contact us at the address below.</li>
        </ul>

        <h2>Your clients and your content</h2>
        <p>
          You are responsible for the requests you send through keyone, for having the rights to that content, and for
          your agreements with your own clients, including how and what you invoice them. keyone prepares reports and
          exports; it does not invoice your clients.
        </p>

        <h2>Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service in breach of the law or of the usage policies of the providers in the catalog;</li>
          <li>attempt to bypass limits, access other agencies’ data or disrupt the Service;</li>
          <li>resell raw access to the Service outside your agency’s own client work without our written agreement.</li>
        </ul>
        <p>We may suspend keys or accounts that break these rules or put the Service or other customers at risk.</p>

        <h2>Availability and liability</h2>
        <p>
          We work to keep keyone available and accurate, but the Service is provided “as is,” without warranty that it
          will be uninterrupted or error-free. To the extent permitted by law, keyone is not liable for indirect or
          consequential losses, and our total liability is limited to the amounts you paid us in the three months before
          the claim.
        </p>

        <h2>Ending your use</h2>
        <p>
          You can stop using keyone and ask us to close your account at any time. We may terminate accounts that breach
          these terms. Our <a href="/privacy">Privacy Policy</a> explains what happens to your data.
        </p>

        <h2>Changes, law and contact</h2>
        <p>
          We may update these terms and will revise the date above when we do; continuing to use the Service means you
          accept the updated terms. These terms are governed by French law. For any question, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </DocumentCentered>
    </Main>
  )
}
