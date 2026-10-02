import { ElCopyable } from '@/components/marketing/elements/tailwindplus-elements'
import { CheckmarkIcon } from '@/components/marketing/icons/checkmark-icon'
import { SparklesIcon } from '@/components/marketing/icons/sparkles-icon'
import { Squares2StackedIcon } from '@/components/marketing/icons/squares-2-stacked-icon'

// The fastest way in, shown first on the docs page: paste one line into a coding agent.
export function AgentSetup({ origin, id }: { origin: string; id: string }) {
  return (
    <section className="rounded-xl bg-olive-950 p-6 sm:p-8 dark:bg-white/5 dark:inset-ring-1 dark:inset-ring-white/10">
      <p className="inline-flex items-center gap-2 text-sm/7 font-semibold text-brand-lime">
        <SparklesIcon /> Fastest way to connect
      </p>
      <h2 id={id} className="mt-2 font-display text-3xl/10 tracking-tight text-balance text-white sm:text-4xl/12">
        Using an AI coding agent? Paste one line.
      </h2>
      <p className="mt-4 text-base/7 text-olive-300">
        In Claude Code, Cursor or another coding agent, paste this. The agent installs the keyone skill, asks for your
        project key in a hidden prompt, and wires the project for you. No account yet? It can start the signup too.
      </p>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-full bg-white/10 p-1 pl-5 font-mono text-sm/7 text-white inset-ring-1 inset-ring-white/10">
        <ElCopyable id="agent-setup-line" className="min-w-0 truncate">
          set up {origin}/skill.md
        </ElCopyable>
        <button
          command="--copy"
          commandfor="agent-setup-line"
          type="button"
          aria-label="Copy"
          className="group relative flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-white/10"
        >
          <Squares2StackedIcon className="group-data-copied:hidden" />
          <CheckmarkIcon className="not-group-data-copied:hidden" />
        </button>
      </div>

      <p className="mt-4 text-sm/7 text-olive-400">
        The{' '}
        <a href="/skill.md" className="font-medium text-white underline decoration-brand-lime underline-offset-4">
          skill file
        </a>{' '}
        is plain Markdown written for agents. Prefer to do it by hand? The quickstart is right below.
      </p>
    </section>
  )
}
