import { clsx } from 'clsx/lite'

/* Product visuals rendered in HTML, shown inside the kit's <Screenshot> frames. */

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx('overflow-hidden bg-white text-sm/6 text-olive-950 dark:bg-olive-900 dark:text-white', className)}>
      {children}
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs/5 font-medium tracking-wide text-olive-500 uppercase">{children}</p>
}

/* ------------------------------------------------------------------ */
/* Problem: keys multiply with every client and every tool             */
/* ------------------------------------------------------------------ */

const sprawlProviders = ['OpenAI', 'Anthropic', 'Perplexity', 'Apify']
const sprawlClients = [
  { name: 'Durand', where: ['.env', 'n8n', 'Make', '.env'] },
  { name: 'Moreau', where: ['n8n', 'n8n', '—', 'Make'] },
  { name: 'Batiplus', where: ['Make', '.env', 'n8n', '—'] },
  { name: 'Lefèvre', where: ['.env', '—', '.env', 'n8n'] },
]

export function KeySprawlDemo() {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-olive-950/10 px-6 py-4 dark:border-white/10">
        <p className="font-medium">Your API keys today</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs/5">
          <thead>
            <tr className="text-olive-500">
              <th className="px-6 py-3 text-left font-medium">Client</th>
              {sprawlProviders.map(p => (
                <th key={p} className="px-2 py-3 text-left font-medium">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sprawlClients.map(c => (
              <tr key={c.name} className="border-t border-olive-950/10 dark:border-white/10">
                <td className="px-6 py-3">{c.name}</td>
                {c.where.map((w, i) =>
                  w === '—' ? (
                    <td key={i} className="px-2 py-3 text-olive-400">
                      —
                    </td>
                  ) : (
                    <td key={i} className="px-2 py-3">
                      <span className="inline-flex items-center gap-1 rounded-sm bg-olive-950/5 px-1.5 py-0.5 font-mono whitespace-nowrap text-olive-700 dark:bg-white/10 dark:text-olive-300">
                        sk-…{(c.name.charCodeAt(0) * (i + 3)).toString(16).slice(-3)}
                        <span className="text-olive-400">· {w}</span>
                      </span>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-olive-950/10 bg-olive-950/2.5 px-6 py-3 text-xs/5 dark:border-white/10 dark:bg-white/5">
        <p className="text-olive-500">+ 8 more clients</p>
        <p className="font-medium text-red-700 dark:text-red-300">≈ 40 keys, 4 bills, 0 budgets per client</p>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------ */
/* Solution: agency → clients → project keys → every tool              */
/* ------------------------------------------------------------------ */

const structureClients = [
  { name: 'Durand Construction', projects: ['Quote generator', 'Site report summarizer'] },
  { name: 'Batiplus', projects: ['Tender scraper', 'Email assistant'] },
]

export function StructureDemo({ tools }: { tools: string[] }) {
  return (
    <Panel className="grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:gap-8">
      <div className="rounded-md bg-olive-950/2.5 px-5 py-4 dark:bg-white/5">
        <Label>Agency</Label>
        <p className="font-display text-2xl/8">Your agency</p>
        <p className="text-xs/5 text-olive-500">One wallet</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {structureClients.map(c => (
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
                  <span className="font-mono text-xs/5 whitespace-nowrap text-brand-green dark:text-brand-lime">
                    kone_live_…
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-md bg-olive-950/2.5 px-5 py-4 dark:bg-white/5">
        <Label>Every tool</Label>
        <ul className="mt-2 flex flex-col gap-1 text-olive-700 dark:text-olive-300">
          {tools.slice(0, 4).map(t => (
            <li key={t}>{t}</li>
          ))}
          <li className="text-olive-400">+ more</li>
        </ul>
      </div>
    </Panel>
  )
}
