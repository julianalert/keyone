import { clsx } from 'clsx/lite'

/*
 * Hero visual for the use-case pages: the keyone structure (workspace → clients →
 * projects → one key each → every tool) with sample names that match the reader's
 * business. Same styling as the product demos, shown inside <Screenshot>.
 */

export interface WorkspaceClient {
  name: string
  projects: string[]
}

export interface WorkspaceDemoProps {
  // What the top-level box is called for this reader ("Your agency", "You")
  owner: string
  ownerNote?: string
  clients: WorkspaceClient[]
  tools: string[]
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs/5 font-medium tracking-wide text-olive-500 uppercase">{children}</p>
}

export function WorkspaceDemo({ owner, ownerNote = 'One wallet', clients, tools }: WorkspaceDemoProps) {
  return (
    <div
      className={clsx(
        'grid items-start gap-5 overflow-hidden bg-white p-5 text-sm/6 text-olive-950 sm:p-6 dark:bg-olive-900 dark:text-white',
        'lg:grid-cols-[auto_1fr_auto] lg:gap-6',
      )}
    >
      <div className="rounded-md bg-olive-950/2.5 px-5 py-4 dark:bg-white/5">
        <Label>Workspace</Label>
        <p className="font-display text-2xl/8">{owner}</p>
        <p className="text-xs/5 text-olive-500">{ownerNote}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map(c => (
          <div key={c.name} className="rounded-md bg-olive-950/2.5 p-4 dark:bg-white/5">
            <Label>Client</Label>
            <p className="mb-3 font-medium">{c.name}</p>
            <div className="flex flex-col gap-2">
              {c.projects.map(p => (
                <div
                  key={p}
                  className="flex items-center justify-between gap-3 rounded-sm bg-white px-3 py-2 ring-1 ring-olive-950/10 dark:bg-olive-950 dark:ring-white/10"
                >
                  <span className="truncate">{p}</span>
                  <span className="font-mono text-xs/5 whitespace-nowrap text-brand-green dark:text-brand-lime">kone_live_…</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-md bg-olive-950/2.5 px-5 py-4 dark:bg-white/5">
        <Label>Every tool</Label>
        <ul className="mt-2 flex flex-col gap-1 text-olive-700 dark:text-olive-300">
          {tools.map(t => (
            <li key={t}>{t}</li>
          ))}
          <li className="text-olive-400">+ more</li>
        </ul>
      </div>
    </div>
  )
}
