import { inngest } from './client'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

async function getAgencyOwnerEmail(agencyId: string): Promise<string | undefined> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('agencies')
    .select('users!agencies_owner_user_id_fkey(email)')
    .eq('id', agencyId)
    .single()
  const owner = (data as unknown as { users: { email: string } | null } | null)?.users
  return owner?.email
}

// Triggered when wallet drops below $5
export const lowBalanceAlert = inngest.createFunction(
  {
    id: 'wallet-low-balance-alert',
    name: 'Wallet Low Balance Alert',
    triggers: [{ event: 'wallet/low-balance' }],
  },
  async ({ event, step }) => {
    const { agency_id, balance, threshold } = event.data as {
      agency_id: string
      balance: number
      threshold: number
    }

    const userEmail = await step.run('get-owner-email', () => getAgencyOwnerEmail(agency_id))

    if (!userEmail) return { skipped: true, reason: 'no email found' }

    await step.run('send-low-balance-email', async () => {
      await getResend().emails.send({
        from: 'key.one <alerts@keyone.io>',
        to: userEmail,
        subject: `⚠️ Your key.one wallet is running low ($${balance.toFixed(2)} remaining)`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a18;">
            <h2 style="font-size: 20px; font-weight: 500; margin-bottom: 8px;">Wallet running low</h2>
            <p style="color: #5F5E5A; margin-bottom: 16px;">
              Your key.one wallet balance has dropped to <strong>$${balance.toFixed(2)}</strong>
              (threshold: $${threshold}).
            </p>
            <p style="color: #5F5E5A; margin-bottom: 24px;">
              Your agents will stop working when the balance reaches $0.
            </p>
            <a
              href="https://keyone.io/dashboard/wallet"
              style="display: inline-block; background: #1a1a18; color: #F9F7F3; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;"
            >
              Top up wallet →
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #888780;">
              key.one · Pure pay-as-you-go
            </p>
          </div>
        `,
      })
    })

    return { sent: true, email: userEmail, balance }
  }
)

// Triggered when wallet is topped up
export const walletToppedUp = inngest.createFunction(
  {
    id: 'wallet-topped-up-confirmation',
    name: 'Wallet Top-up Confirmation Email',
    triggers: [{ event: 'wallet/topped-up' }],
  },
  async ({ event, step }) => {
    const { agency_id, amount_usd, payment_intent_id } = event.data as {
      agency_id: string
      amount_usd: number
      payment_intent_id: string
    }

    const userEmail = await step.run('get-owner-email', () => getAgencyOwnerEmail(agency_id))

    if (!userEmail) return { skipped: true }

    await step.run('send-topup-confirmation', async () => {
      await getResend().emails.send({
        from: 'key.one <receipts@keyone.io>',
        to: userEmail,
        subject: `Receipt: $${amount_usd.toFixed(2)} added to your key.one wallet`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #1a1a18;">
            <h2 style="font-size: 20px; font-weight: 500; margin-bottom: 8px;">Wallet topped up</h2>
            <p style="color: #5F5E5A; margin-bottom: 16px;">
              <strong>$${amount_usd.toFixed(2)}</strong> has been added to your key.one wallet.
            </p>
            <p style="font-size: 12px; color: #888780; margin-bottom: 24px;">
              Payment reference: ${payment_intent_id}
            </p>
            <a
              href="https://keyone.io/dashboard"
              style="display: inline-block; background: #1a1a18; color: #F9F7F3; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;"
            >
              View dashboard →
            </a>
            <p style="margin-top: 24px; font-size: 12px; color: #888780;">
              key.one · Pure pay-as-you-go
            </p>
          </div>
        `,
      })
    })

    return { sent: true, email: userEmail, amount_usd }
  }
)
