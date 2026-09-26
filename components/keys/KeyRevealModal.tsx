'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface Props {
  title: string
  subtitle?: string
  apiKey: string
  onClose: () => void
}

// Shown exactly once after a key is minted. The plaintext is never stored.
export function KeyRevealModal({ title, subtitle, apiKey, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(apiKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-6">
        <div className="mb-5">
          <Badge variant="green" className="mb-3">Key issued</Badge>
          <h2 className="serif text-2xl font-normal mb-1">{title}</h2>
          {subtitle && <p className="text-sm text-ink-muted mb-2">{subtitle}</p>}
          <p className="text-sm text-red-600 font-medium">
            Copy this key now. It won&apos;t be shown again.
          </p>
        </div>

        <div className="bg-ink rounded-lg p-4 mb-4">
          <p className="text-2xs text-ink-subtle uppercase tracking-widest mb-2">Project key</p>
          <code className="text-green-light text-sm break-all font-mono">{apiKey}</code>
        </div>

        <div className="bg-bg rounded-lg p-4 mb-5" style={{ border: '0.5px solid #e0ddd7' }}>
          <p className="text-xs text-ink-muted mb-2">Use it with any API in the catalog</p>
          <pre className="text-xs text-ink font-mono overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/proxy/openai \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hello"}]}'`}</pre>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={copy} className="flex-1">
            {copied ? '✓ Copied' : 'Copy key'}
          </Button>
          <Button onClick={onClose} className="flex-1">Done</Button>
        </div>
      </Card>
    </div>
  )
}
