import type { Figures } from '../guides/guides'

/*
 * Figures embedded in blog posts with `<figure data-figure="name"></figure>`.
 * Post bodies are rendered to an HTML string, so each figure is static markup
 * (no client JavaScript); hover states are CSS only. Class names stay literal
 * so Tailwind picks them up.
 */

const card =
  'overflow-hidden rounded-xl bg-white text-base/7 ring-1 ring-olive-950/10 dark:bg-white/5 dark:ring-white/10'
function figure(body: string, caption: string) {
  return `<figure>${body}<figcaption class="mt-3 text-sm/6 text-olive-500">${caption}</figcaption></figure>`
}

function header(title: string, subtitle: string, extra = '') {
  return `<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
<div><p class="text-sm/6 font-semibold text-olive-950 dark:text-white">${title}</p><p class="text-sm/6 text-olive-500">${subtitle}</p></div>${extra}
</div>`
}

/* ---------- Four loop patterns ---------- */

// Mini diagram geometry (viewBox units)
const NODE_Y = 22
const NODE_H = 36
const NODE_BOTTOM = NODE_Y + NODE_H

interface Node {
  x: number
  w: number
  label: string
  paid?: boolean
  failing?: boolean
}

function node({ x, w, label, paid, failing }: Node) {
  const cx = x + w / 2
  const badge = paid
    ? `<circle cx="${x + w - 2}" cy="${NODE_Y + 2}" r="9" class="fill-brand-lime stroke-white dark:stroke-olive-900" stroke-width="2"/><text x="${x + w - 2}" y="${NODE_Y + 6}" text-anchor="middle" class="fill-olive-950 text-[11px] font-semibold">$</text>`
    : failing
      ? `<circle cx="${x + w - 2}" cy="${NODE_Y + 2}" r="9" class="fill-red-500 stroke-white dark:stroke-olive-900" stroke-width="2"/><path d="M${x + w - 5.5} ${NODE_Y - 1.5}l7 7m0-7l-7 7" class="stroke-white" stroke-width="1.75" stroke-linecap="round"/>`
      : ''
  return `<rect x="${x}" y="${NODE_Y}" width="${w}" height="${NODE_H}" rx="8" class="fill-white stroke-olive-950/20 dark:fill-olive-900 dark:stroke-white/20" stroke-width="1"/><text x="${cx}" y="${NODE_Y + 22}" text-anchor="middle" class="fill-olive-950 text-[12px] font-medium dark:fill-white">${label}</text>${badge}`
}

// Straight arrow between two nodes, with an optional label above it
function forward(id: string, a: Node, b: Node, label = '') {
  const y = NODE_Y + NODE_H / 2
  const text = label
    ? `<text x="${(a.x + a.w + b.x) / 2}" y="${y - 8}" text-anchor="middle" class="fill-olive-500 text-[10px]">${label}</text>`
    : ''
  return `<path d="M${a.x + a.w + 3} ${y}H${b.x - 4}" class="stroke-olive-950/35 dark:stroke-white/35" stroke-width="1.5" marker-end="url(#${id}-fwd)"/>${text}`
}

// The loop: a red arc from the bottom of one node back to another, with its label under it
function loop(id: string, from: Node, to: Node, label: string) {
  const x1 = from.x + from.w / 2
  const x2 = to.x + to.w / 2
  return `<path d="M${x1} ${NODE_BOTTOM + 2}C${x1} ${NODE_BOTTOM + 50} ${x2} ${NODE_BOTTOM + 50} ${x2} ${NODE_BOTTOM + 6}" fill="none" class="stroke-red-500" stroke-width="2" stroke-linecap="round" marker-end="url(#${id}-loop)"/><text x="${(x1 + x2) / 2}" y="${NODE_BOTTOM + 58}" text-anchor="middle" class="fill-olive-600 text-[11px] dark:fill-olive-400">${label}</text>`
}

function markers(id: string) {
  return `<defs><marker id="${id}-fwd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1L8 5L1 9" fill="none" class="stroke-olive-950/35 dark:stroke-white/35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></marker><marker id="${id}-loop" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="fill-red-500"/></marker></defs>`
}

function pattern(n: number, title: string, label: string, body: (id: string) => string) {
  const id = `loop-pattern-${n}`
  // Hairlines between the cells of the 2 × 2 grid
  const divider = n % 2 === 0 ? 'sm:border-l' : ''
  return `<div class="flex flex-col gap-3 border-t border-olive-950/10 p-5 dark:border-white/10 ${divider}">
<p class="text-sm/6 font-semibold text-olive-950 dark:text-white"><span class="text-olive-400">${n}</span>&ensp;${title}</p>
<svg viewBox="0 0 320 124" class="w-full" role="img" aria-label="${label}">${markers(id)}${body(id)}</svg>
</div>`
}

const retry = { batch: { x: 8, w: 66, label: 'Batch' }, model: { x: 106, w: 100, label: 'OpenAI node', paid: true }, crm: { x: 238, w: 74, label: 'CRM API', failing: true } }
const handler = { main: { x: 18, w: 116, label: 'Main workflow', paid: true }, error: { x: 186, w: 116, label: 'Error workflow' } }
const echo = { crm: { x: 8, w: 62, label: 'CRM' }, flow: { x: 96, w: 90, label: 'Workflow', paid: true }, update: { x: 212, w: 100, label: 'Update record' } }
const agent = { agent: { x: 36, w: 104, label: 'AI Agent', paid: true }, tool: { x: 196, w: 88, label: 'Tool' } }

const loopPatterns = figure(
  `<div class="${card} grid grid-cols-1 sm:grid-cols-2">
<div class="p-5 sm:col-span-2">${header(
    'Four ways an n8n workflow loops',
    'Each one sends the paid prompt again',
    `<div class="flex items-center gap-4 text-xs/6 text-olive-600 dark:text-olive-400">
<span class="flex items-center gap-1.5"><span class="flex size-4 items-center justify-center rounded-full bg-brand-lime text-[10px] font-semibold text-olive-950">$</span>Paid model call</span>
<span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full bg-red-500"></span>The loop</span>
</div>`,
  )}</div>
${pattern(1, 'Retry storm', 'Batch to OpenAI node to CRM API, which fails; every item retries the OpenAI node', id =>
    [
      forward(id, retry.batch, retry.model),
      forward(id, retry.model, retry.crm),
      loop(id, retry.crm, retry.model, 'retry, every item'),
      node(retry.batch),
      node(retry.model),
      node(retry.crm),
    ].join(''),
  )}
${pattern(2, 'Error handler re-runs the job', 'Main workflow fails, the error workflow runs it again with Execute Workflow', id =>
    [
      forward(id, handler.main, handler.error, 'fails'),
      loop(id, handler.error, handler.main, 'Execute Workflow'),
      node(handler.main),
      node(handler.error),
    ].join(''),
  )}
${pattern(3, 'Webhook echo', 'CRM webhook starts the workflow, which updates the record, which fires the webhook again', id =>
    [
      forward(id, echo.crm, echo.flow),
      forward(id, echo.flow, echo.update),
      loop(id, echo.update, echo.crm, '“record updated” webhook'),
      node(echo.crm),
      node(echo.flow),
      node(echo.update),
    ].join(''),
  )}
${pattern(4, 'Agent spin', 'AI Agent calls a tool again and again until Max Iterations', id =>
    [
      forward(id, agent.agent, agent.tool, 'calls'),
      loop(id, agent.tool, agent.agent, 'until Max Iterations'),
      node(agent.agent),
      node(agent.tool),
    ].join(''),
  )}
</div>`,
  'The four patterns behind most runaway n8n bills. Each pass is a new paid call to the model.',
)

/* ---------- What one night costs ---------- */

const PER_HOUR = 45 // 1,200 calls × $0.0375
const CALLS_PER_HOUR = 1200
const HOURS = 9 // 11 PM to 8 AM
const Y_MAX = 450
const RETAINER = 300
const clock = ['11 PM', '12 AM', '1 AM', '2 AM', '3 AM', '4 AM', '5 AM', '6 AM', '7 AM', '8 AM']

const xPct = (hour: number) => (hour / HOURS) * 100
const yPct = (dollars: number) => ((Y_MAX - dollars) / Y_MAX) * 100
const pos = (hour: number, dollars: number) => `left:${xPct(hour).toFixed(2)}%;top:${yPct(dollars).toFixed(2)}%`
const dot = 'absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-olive-900'

const crossing = RETAINER / PER_HOUR // 6 h 40 min after 11 PM
const end = HOURS * PER_HOUR

const gridlines = [0, 100, 200, 300, 400]
  .map(
    v => `<div class="absolute inset-x-0 h-px ${v === 0 ? 'bg-olive-950/20 dark:bg-white/20' : 'bg-olive-950/5 dark:bg-white/5'}" style="top:${yPct(v).toFixed(2)}%"></div>
<span class="absolute -left-2 -translate-x-full -translate-y-1/2 text-xs/5 text-olive-500 tabular-nums" style="top:${yPct(v).toFixed(2)}%">$${v}</span>`,
  )
  .join('\n')

const xLabels = clock
  .map((label, hour) => {
    const align = hour === 0 ? '' : hour === HOURS ? '-translate-x-full' : '-translate-x-1/2'
    // Every other hour on small screens
    return `<span class="absolute top-2 whitespace-nowrap text-xs/5 text-olive-500 ${align} ${hour % 2 ? 'max-sm:hidden' : ''}" style="left:${xPct(hour).toFixed(2)}%">${label}</span>`
  })
  .join('\n')

// One hover column per hour: a guide line, the point and a tooltip
const hoverColumns = Array.from({ length: HOURS }, (_, i) => i + 1)
  .map(hour => {
    const spent = hour * PER_HOUR
    const left = xPct(hour - 0.5)
    const width = hour === HOURS ? 50 / HOURS : 100 / HOURS
    const tooltipSide = hour >= 5 ? 'right-[calc(100%+10px)]' : 'left-[calc(100%+10px)]'
    return `<div class="group absolute inset-y-0" style="left:${left.toFixed(2)}%;width:${width.toFixed(2)}%" aria-hidden="true">
<div class="absolute inset-y-0 w-px bg-olive-950/15 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-white/20" style="left:${hour === HOURS ? 100 : 50}%"></div>
<div class="absolute opacity-0 transition-opacity group-hover:opacity-100" style="left:${hour === HOURS ? 100 : 50}%;top:${yPct(spent).toFixed(2)}%">
<span class="${dot} left-0 top-0 bg-brand-green dark:bg-brand-lime"></span>
<span class="pointer-events-none absolute top-0 -translate-y-1/2 ${tooltipSide} rounded-md bg-olive-950 px-2.5 py-1.5 text-xs/5 whitespace-nowrap text-white shadow-lg dark:bg-white dark:text-olive-950"><span class="block text-white/60 dark:text-olive-950/60">${clock[hour]}</span><span class="font-semibold">$${spent}</span> spent · ${(hour * CALLS_PER_HOUR).toLocaleString('en-US')} calls</span>
</div>
</div>`
  })
  .join('\n')

const table = `<table><caption>Cumulative spend by hour</caption><thead><tr><th>Time</th><th>Calls</th><th>Spend</th></tr></thead><tbody>${clock
  .map((label, hour) => `<tr><td>${label}</td><td>${(hour * CALLS_PER_HOUR).toLocaleString('en-US')}</td><td>$${hour * PER_HOUR}</td></tr>`)
  .join('')}</tbody></table>`

const overnightCost = figure(
  `<div class="${card} p-5 sm:p-6">
${header('One looping workflow, overnight', 'Cumulative spend at about $45 an hour')}
<div class="relative mt-8 mb-9 ml-11 mr-1 h-56 sm:h-64">
${gridlines}
<svg viewBox="0 0 ${HOURS * 100} ${Y_MAX}" preserveAspectRatio="none" class="absolute inset-0 size-full overflow-visible" aria-hidden="true">
<path d="M0 ${Y_MAX}L${HOURS * 100} ${Y_MAX - end}V${Y_MAX}Z" class="fill-brand-green/10 dark:fill-brand-lime/10"/>
<path d="M0 ${Y_MAX}L${HOURS * 100} ${Y_MAX - end}" fill="none" class="stroke-brand-green dark:stroke-brand-lime" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
</svg>
<div class="absolute inset-x-0 h-px bg-olive-950/60 dark:bg-white/60" style="top:${yPct(RETAINER).toFixed(2)}%"></div>
<span class="absolute left-0 pt-1 text-xs/5 font-medium text-olive-950 dark:text-white" style="top:${yPct(RETAINER).toFixed(2)}%">$300 monthly retainer</span>
<span class="absolute -translate-x-full -translate-y-full pr-2 pb-1 text-xs/5 font-medium whitespace-nowrap text-olive-950 dark:text-white" style="${pos(crossing, RETAINER)}">Passed at 5:40 AM</span>
<span class="${dot} bg-olive-950 dark:bg-white" style="${pos(crossing, RETAINER)}"></span>
<span class="absolute -translate-x-full -translate-y-full pr-2 pb-1 text-xs/5 font-semibold whitespace-nowrap text-olive-950 dark:text-white" style="${pos(HOURS, end)}">$${end} by 8 AM</span>
<span class="${dot} bg-brand-green dark:bg-brand-lime" style="${pos(HOURS, end)}"></span>
${hoverColumns}
<div class="absolute inset-x-0 top-full">
${xLabels}
</div>
</div>
<div class="sr-only">${table}</div>
</div>`,
  'Illustrative: 1,200 calls an hour × $0.0375 per call (6,000 input + 500 output tokens at $5 / $15 per 1M).',
)

/* ---------- Where each guard sits ---------- */

const path: { step: string; detail: string; guard?: { n: number; name: string; setting: string } }[] = [
  {
    step: 'Trigger',
    detail: 'Webhook or poll',
    guard: { n: 3, name: 'Dedupe', setting: 'Skip IDs already processed, and your own integration’s updates' },
  },
  {
    step: 'Workflow run',
    detail: 'And its error workflow',
    guard: { n: 4, name: 'Timeout', setting: 'A little above the normal run time; the error workflow only alerts' },
  },
  {
    step: 'AI Agent',
    detail: 'And nested agent tools',
    guard: { n: 2, name: 'Max Iterations', setting: '5 to 8 while you build' },
  },
  {
    step: 'Model node',
    detail: 'Every call is billed',
    guard: { n: 1, name: 'Retry cap', setting: '2–3 tries, 1,000 ms apart, no retry on a 400 or 401' },
  },
  {
    step: 'Client key',
    detail: 'One per client',
    guard: { n: 5, name: 'Ceiling', setting: 'A monthly cap, with alerts at 50% and 80%' },
  },
  { step: 'Provider', detail: 'OpenAI, Anthropic…' },
]

const guards = figure(
  `<div class="${card} p-5 sm:p-6">
${header('Where each guard sits', 'From the trigger to the provider. Numbers match the list below.')}
<div class="mt-6 flex flex-col gap-5">
${path
  .map(
    // A rail runs through every step's dot, from the first dot to the last
    ({ step, detail, guard }) => `<div class="relative grid grid-cols-1 gap-x-6 gap-y-2 pl-8 sm:grid-cols-[10rem_1fr] sm:items-center before:absolute before:top-0 before:-bottom-5 before:left-[5px] before:w-px before:bg-olive-950/20 first:before:top-3 sm:first:before:top-1/2 last:before:bottom-auto last:before:h-3 sm:last:before:h-1/2 dark:before:bg-white/15">
<span class="absolute top-1.5 left-0 size-[11px] rounded-full border-2 border-olive-950/40 bg-white sm:top-1/2 sm:-translate-y-1/2 dark:border-white/40 dark:bg-olive-900"></span>
<div class="text-sm/6"><p class="font-medium text-olive-950 dark:text-white">${step}</p><p class="text-olive-500">${detail}</p></div>
${
  guard
    ? `<div class="flex items-start gap-3 rounded-lg bg-brand-lime/15 px-3.5 py-2.5 text-sm/6 ring-1 ring-brand-lime/50 dark:bg-brand-lime/10 dark:ring-brand-lime/30"><span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-semibold text-white">${guard.n}</span><p class="text-olive-700 dark:text-olive-300"><span class="font-semibold text-olive-950 dark:text-white">${guard.name}.</span> ${guard.setting}</p></div>`
    : `<div class="rounded-lg bg-olive-950/2.5 px-3.5 py-2.5 text-sm/6 text-olive-600 ring-1 ring-olive-950/10 dark:bg-white/5 dark:text-olive-400 dark:ring-white/10">The provider’s own spend limit: your last line, not your first</div>`
}
</div>`,
  )
  .join('\n')}
</div>
</div>`,
  'Each guard sits where its loop starts, so a failure stops one step in.',
)

/* ---------- What makes up a client's monthly AI cost ---------- */

// Each factor is a row: its name on the left, what it is on the right; the operators sit between rows
const factor =
  'grid grid-cols-1 gap-x-5 gap-y-2 rounded-lg bg-olive-950/2.5 p-4 ring-1 ring-olive-950/10 sm:grid-cols-[9rem_1fr] sm:items-center dark:bg-white/5 dark:ring-white/10'
const factorLabel = 'text-xs/5 font-semibold tracking-wide text-olive-500 uppercase'
const factorNote = 'text-sm/6 text-olive-600 dark:text-olive-400'
const operator = (symbol: string) =>
  `<div class="flex h-7 items-center pl-4 text-lg text-olive-400 sm:w-36 sm:justify-center sm:pl-0" aria-hidden="true">${symbol}</div>`
const term =
  'rounded-md bg-white px-3 py-1.5 text-sm/6 text-olive-950 ring-1 ring-olive-950/10 dark:bg-olive-900 dark:text-white dark:ring-white/10'

const costFormula = figure(
  `<div class="${card} p-5 sm:p-6">
${header('What makes up a client’s monthly AI cost', 'Three numbers, multiplied')}
<div class="mt-6">
<div class="${factor}">
<p class="${factorLabel}">Runs per month</p>
<p class="${factorNote}">How often the workflow fires: leads, emails, tickets</p>
</div>
${operator('×')}
<div class="${factor}">
<p class="${factorLabel}">Cost of one run</p>
<div class="flex flex-col gap-2">
<div class="flex flex-wrap items-center gap-1.5">
<span class="${term}">Input tokens × input price</span>
<span class="${term}">+ Output tokens × output price <span class="whitespace-nowrap text-olive-500">(3–5× more)</span></span>
</div>
<p class="${factorNote}">Per million tokens, added up for every AI step. The system prompt and context are input on every call.</p>
</div>
</div>
${operator('×')}
<div class="${factor}">
<p class="${factorLabel}">Buffer</p>
<p class="${factorNote}"><span class="font-semibold text-olive-950 dark:text-white">1.3</span> · retries, testing and growth, about 10% each</p>
</div>
${operator('=')}
<div class="grid grid-cols-1 gap-x-5 gap-y-1 rounded-lg bg-olive-950 p-4 text-white sm:grid-cols-[9rem_1fr] sm:items-center dark:bg-white dark:text-olive-950">
<p class="text-xs/5 font-semibold tracking-wide uppercase">Monthly AI cost</p>
<p class="text-sm/6 text-white/70 dark:text-olive-950/70">The number that goes in the quote</p>
</div>
</div>
</div>`,
  'Runs per month × the cost of one run × a buffer. Measure the middle number on real samples.',
)

/* ---------- The 30% buffer, on the worked example ---------- */

const BASE = 55.34 // 1,500 runs × $0.03689
const BUFFER_ITEM = 5.53 // 10% of the base
const BUFFERED = 71.94 // base × 1.3
const QUOTE = 75
const SCALE = 80

const bufferItems = ['Retries and failed runs', 'Testing and prompt edits', 'Volume growth']
const usd = (n: number) => `$${n.toFixed(2)}`

// Hover label above a bar segment
const segmentTip = (text: string, side: string) =>
  `<span class="pointer-events-none absolute bottom-full mb-2 ${side} rounded-md bg-olive-950 px-2.5 py-1.5 text-xs/5 whitespace-nowrap text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-white dark:text-olive-950">${text}</span>`

const bar = `<div class="flex h-9 gap-0.5" style="width:${((BUFFERED / SCALE) * 100).toFixed(2)}%">
<div class="group relative flex min-w-0 items-center bg-brand-green px-3 dark:bg-brand-lime" style="flex:${BASE}">
<span class="truncate text-xs/5 font-semibold text-white dark:text-olive-950">Base ${usd(BASE)}</span>
${segmentTip(`Measured base · ${usd(BASE)}`, 'left-0')}
</div>
${bufferItems
  .map(
    (name, i) => `<div class="group relative flex items-center justify-center bg-brand-lime dark:bg-brand-lime/45 ${i === bufferItems.length - 1 ? 'rounded-r-[4px]' : ''}" style="flex:${BUFFER_ITEM}">
<span class="text-xs/5 font-semibold text-olive-950 dark:text-white">${i + 1}</span>
${segmentTip(`${name} · ${usd(BUFFER_ITEM)}`, 'right-0')}
</div>`,
  )
  .join('\n')}
</div>`

const receiptRow = (swatch: string, label: string, detail: string, amount: string) =>
  `<div class="flex items-baseline gap-3 py-2"><span class="flex w-5 shrink-0 justify-center self-center">${swatch}</span><p class="min-w-0 flex-1 text-olive-950 dark:text-white">${label} <span class="text-olive-500">${detail}</span></p><p class="text-olive-950 tabular-nums dark:text-white">${amount}</p></div>`

const bufferBreakdown = figure(
  `<div class="${card} p-5 sm:p-6">
${header('Worked example: what goes in the quote', 'Measured base plus a 30% buffer, per month')}
<div class="relative mt-12" role="img" aria-label="Stacked bar: measured base $55.34 plus three buffer items of $5.53 each, $71.94 in total, quoted at $75">
${bar}
<div class="absolute -top-7 -bottom-2 w-px bg-olive-950 dark:bg-white" style="left:${((QUOTE / SCALE) * 100).toFixed(2)}%" aria-hidden="true">
<span class="absolute top-0 right-full pr-1.5 text-xs/5 font-semibold whitespace-nowrap text-olive-950 dark:text-white">Quote $${QUOTE}</span>
</div>
</div>
<div class="mt-6 divide-y divide-olive-950/10 text-sm/6 dark:divide-white/10">
${receiptRow('<span class="size-3 rounded-[3px] bg-brand-green dark:bg-brand-lime"></span>', 'Measured base', '1,500 runs × $0.03689', usd(BASE))}
${bufferItems
  .map((name, i) =>
    receiptRow(
      `<span class="flex size-5 items-center justify-center rounded-[4px] bg-brand-lime text-[11px] font-semibold text-olive-950 dark:bg-brand-lime/45 dark:text-white">${i + 1}</span>`,
      name,
      '+10%',
      usd(BUFFER_ITEM),
    ),
  )
  .join('\n')}
${receiptRow('', 'Buffered estimate', 'base × 1.3', usd(BUFFERED))}
<div class="flex items-baseline gap-3 py-2 font-semibold"><span class="flex w-5 shrink-0 justify-center self-stretch"><span class="w-px bg-olive-950 dark:bg-white"></span></span><p class="flex-1 text-olive-950 dark:text-white">Quote, rounded up</p><p class="text-olive-950 tabular-nums dark:text-white">$${QUOTE}.00</p></div>
</div>
</div>`,
  'The worked example above: a $55.34 base and three 10% buffer items, rounded up to $75 for the quote.',
)

export const blogFigures: Figures = {
  'n8n-loop-patterns': loopPatterns,
  'n8n-loop-overnight-cost': overnightCost,
  'n8n-loop-guards': guards,
  'ai-cost-formula': costFormula,
  'ai-cost-buffer': bufferBreakdown,
}
