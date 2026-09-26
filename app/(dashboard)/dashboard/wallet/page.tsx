'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { formatUSD, formatDate } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const TOP_UP_AMOUNTS = [10, 25, 50, 100, 250]
const TOP_UP_MIN = 5

interface WalletData {
  balance_usd: number
  updated_at: string
  recent_transactions: Transaction[]
}

interface Transaction {
  id: string
  type: 'topup' | 'deduction'
  amount_usd: number
  description: string | null
  created_at: string
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showTopUp, setShowTopUp] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [intentId, setIntentId] = useState<string | null>(null)
  const [testMode, setTestMode] = useState(false)
  const [topupError, setTopupError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [selectedAmount, setSelectedAmount] = useState<number>(25)
  const [customAmount, setCustomAmount] = useState('')
  const [loadingIntent, setLoadingIntent] = useState(false)
  const [page, setPage] = useState(1)
  const [totalTxns, setTotalTxns] = useState(0)

  const fetchWallet = useCallback(async () => {
    const res = await fetch('/api/wallet')
    const data = await res.json()
    setWallet(data)
  }, [])

  const fetchTransactions = useCallback(async () => {
    const res = await fetch(`/api/wallet/transactions?page=${page}&limit=20`)
    const data = await res.json()
    setTransactions(data.transactions ?? [])
    setTotalTxns(data.total ?? 0)
  }, [page])

  useEffect(() => { fetchWallet() }, [fetchWallet])
  useEffect(() => { fetchTransactions() }, [fetchTransactions])

  async function handleTopUpStart() {
    const amount = customAmount ? Number(customAmount) : selectedAmount
    if (!amount || amount < TOP_UP_MIN) return

    setLoadingIntent(true)
    setTopupError(null)
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount_usd: amount }),
    })
    const data = await res.json()
    setLoadingIntent(false)
    if (!res.ok) { setTopupError(data.error ?? 'Could not start payment'); return }
    setClientSecret(data.client_secret)
    setIntentId(data.payment_intent_id)
    setTestMode(!!data.test_mode)
  }

  // After the card is confirmed, have the server verify with Stripe and
  // credit the wallet, so the balance updates without waiting for the webhook.
  async function handlePaid() {
    setShowTopUp(false)
    setClientSecret(null)
    if (intentId) {
      const res = await fetch('/api/wallet/topup/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_intent_id: intentId }),
      })
      const d = await res.json()
      setNotice(res.ok && d.status === 'succeeded' ? `$${Number(d.amount_usd).toFixed(2)} added. Balance is now $${Number(d.balance_usd).toFixed(2)}.` : 'Payment received. Your balance will update in a moment.')
    }
    setIntentId(null)
    fetchWallet()
    fetchTransactions()
    setTimeout(() => { fetchWallet(); fetchTransactions() }, 4000)
  }

  const effectiveAmount = customAmount ? Number(customAmount) : selectedAmount
  const isLowBalance = (wallet?.balance_usd ?? 0) < 5

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="serif text-4xl font-normal">Wallet</h1>
      </div>

      {notice && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-green-pale text-sm text-green-dark flex items-center justify-between" style={{ border: '0.5px solid #C0DD97' }}>
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-green-dark/60 hover:text-green-dark">×</button>
        </div>
      )}

      {/* Balance card */}
      <Card className="mb-6 p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-ink-subtle mb-1">Available balance</p>
            <p className={`serif text-5xl font-normal ${isLowBalance ? 'text-red-600' : 'text-ink'}`}>
              {wallet ? formatUSD(wallet.balance_usd, 2) : '—'}
            </p>
            {isLowBalance && (
              <p className="text-xs text-red-500 mt-1">Running low — top up to keep agents running</p>
            )}
          </div>
          <Button onClick={() => setShowTopUp(true)} variant="green" size="md">
            Add funds
          </Button>
        </div>
      </Card>

      {/* Top-up modal */}
      {showTopUp && (
        <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="serif text-2xl font-normal">Add funds</h2>
              <button
                onClick={() => { setShowTopUp(false); setClientSecret(null) }}
                className="text-ink-muted hover:text-ink text-lg leading-none"
              >
                ×
              </button>
            </div>

            {!clientSecret ? (
              <>
                <div className="mb-5">
                  <p className="text-xs text-ink-muted mb-3">Select amount</p>
                  <div className="grid grid-cols-4 gap-2">
                    {TOP_UP_AMOUNTS.map(amount => (
                      <button
                        key={amount}
                        onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                        className={`py-2.5 rounded text-sm font-medium transition-colors ${
                          !customAmount && selectedAmount === amount
                            ? 'bg-ink text-bg'
                            : 'bg-bg border border-border text-ink-muted hover:text-ink hover:border-ink-muted'
                        }`}
                        style={{ borderWidth: '0.5px' }}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-ink-muted mb-1.5">Custom amount (min ${TOP_UP_MIN})</p>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      min={TOP_UP_MIN}
                      max="5000"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      className="w-full px-3 py-2.5 bg-bg border rounded text-sm text-ink placeholder:text-ink-subtle outline-none focus:border-ink-muted"
                      style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }}
                    />
                  </div>
                </div>
                {topupError && <p className="text-xs text-red-500 mb-3">{topupError}</p>}
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={() => setShowTopUp(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleTopUpStart}
                    loading={loadingIntent}
                    disabled={!effectiveAmount || effectiveAmount < TOP_UP_MIN}
                    className="flex-1"
                  >
                    Pay ${effectiveAmount || '—'}
                  </Button>
                </div>
              </>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'flat',
                    variables: {
                      colorBackground: '#F9F7F3',
                      colorText: '#1a1a18',
                      colorDanger: '#DC2626',
                      fontFamily: 'DM Sans, sans-serif',
                      borderRadius: '6px',
                    },
                  },
                }}
              >
                <CheckoutForm
                  amount={effectiveAmount}
                  testMode={testMode}
                  onSuccess={handlePaid}
                  onCancel={() => { setShowTopUp(false); setClientSecret(null); setIntentId(null) }}
                />
              </Elements>
            )}
          </Card>
        </div>
      )}

      {/* Transaction history */}
      <Card>
        <div className="px-5 py-4" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
          <p className="text-sm font-medium text-ink">Transaction history</p>
        </div>
        {transactions.length === 0 ? (
          <CardContent className="text-center py-8">
            <p className="text-sm text-ink-muted">No transactions yet</p>
          </CardContent>
        ) : (
          <>
            {/* Column headers */}
            <div
              className="px-5 py-2 grid grid-cols-3 text-2xs text-ink-subtle uppercase tracking-wider"
              style={{ borderBottom: '0.5px solid #e0ddd7' }}
            >
              <span>Type</span>
              <span>Description</span>
              <span className="text-right">Amount</span>
            </div>
            {transactions.map((txn, i) => (
              <div
                key={txn.id}
                className="px-5 py-3.5 grid grid-cols-3 gap-4 text-sm hover:bg-border/20 transition-colors"
                style={i < transactions.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}
              >
                <div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: txn.type === 'topup' ? '#EAF3DE' : '#F9F7F3',
                      color: txn.type === 'topup' ? '#3B6D11' : '#5F5E5A',
                      border: txn.type === 'deduction' ? '0.5px solid #e0ddd7' : 'none',
                    }}
                  >
                    {txn.type === 'topup' ? '↑ Top-up' : '↓ Deduction'}
                  </span>
                  <p className="text-2xs text-ink-subtle mt-1">{formatDate(txn.created_at)}</p>
                </div>
                <span className="text-ink-muted self-center">
                  {txn.description ?? '—'}
                </span>
                <span
                  className={`text-right font-medium self-center ${
                    txn.type === 'topup' ? 'text-green-dark' : 'text-ink'
                  }`}
                >
                  {txn.type === 'topup' ? '+' : '−'}{formatUSD(Number(txn.amount_usd), 6)}
                </span>
              </div>
            ))}

            {/* Pagination */}
            {totalTxns > 20 && (
              <div className="px-5 py-4 flex items-center justify-between" style={{ borderTop: '0.5px solid #e0ddd7' }}>
                <p className="text-xs text-ink-muted">
                  Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, totalTxns)} of {totalTxns}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page * 20 >= totalTxns}
                    onClick={() => setPage(p => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

function CheckoutForm({
  amount,
  testMode,
  onSuccess,
  onCancel,
}: {
  amount: number
  testMode: boolean
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed')
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handlePay} className="flex flex-col gap-4">
      <div className="bg-green-pale px-4 py-3 rounded-lg text-sm text-green-dark font-medium flex items-center justify-between">
        <span>Adding ${amount.toFixed(2)} to your wallet</span>
        {testMode && <span className="text-2xs uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700">Test mode</span>}
      </div>
      <PaymentElement />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" loading={loading} disabled={!stripe} className="flex-1">
          Pay ${amount.toFixed(2)}
        </Button>
      </div>
    </form>
  )
}
