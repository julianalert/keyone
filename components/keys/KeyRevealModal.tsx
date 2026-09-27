'use client'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ConnectSnippets, useOrigin } from '@/components/onboarding/ConnectSnippets'
import { SetupCard, KeyRow, PromptTile, PROMPTS } from '@/components/onboarding/FirstRun'

interface Props {
  title: string
  subtitle?: string
  apiKey: string
  onClose: () => void
}

// Shown once after a project key is minted. The welcome screen in miniature:
// set up the agent, the key, prompts to try.
export function KeyRevealModal({ title, subtitle, apiKey, onClose }: Props) {
  const origin = useOrigin()

  return (
    <div className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl my-4 max-h-[calc(100vh-2rem)] overflow-y-auto flex flex-col gap-4">
        <Card className="p-6">
          <Badge variant="green" className="mb-3">Key issued</Badge>
          <h2 className="serif text-2xl font-normal mb-1">Connect {title}</h2>
          {subtitle && <p className="text-sm text-ink-muted">{subtitle}</p>}
        </Card>

        <SetupCard n={1} origin={origin} />

        <Card>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <span className="w-7 h-7 rounded-full bg-ink text-bg text-sm flex items-center justify-center shrink-0">2</span>
            <span className="text-lg text-ink">Your project key for {title}</span>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <p className="text-sm text-ink-muted">Give this key to your agent when it asks. It spends within the project&apos;s budget and every call is logged under this project.</p>
            <KeyRow apiKey={apiKey} label="Project key" />
          </div>
        </Card>

        <Card>
          <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
            <span className="w-7 h-7 rounded-full bg-ink text-bg text-sm flex items-center justify-center shrink-0">3</span>
            <span className="text-lg text-ink">Try it out</span>
          </div>
          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PROMPTS(origin).map(p => <PromptTile key={p.title} title={p.title} text={p.text} />)}
            </div>
            <details>
              <summary className="text-xs text-ink-muted hover:text-ink cursor-pointer select-none">No agent? OpenAI SDK, Anthropic SDK and curl snippets</summary>
              <div className="mt-3"><ConnectSnippets apiKey={apiKey} projectName={title} manualOnly compact /></div>
            </details>
            <div className="flex justify-end">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
