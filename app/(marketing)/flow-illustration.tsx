import { clsx } from 'clsx/lite'

/*
 * Animated diagram for the homepage "solution" section: calls flow like a
 * liquid from each client project key, through keyone (where access, spend
 * and limits are handled), out to every tool in the catalog. One flow hits
 * its budget and stops at keyone. Animations live in marketing.css and are
 * disabled under prefers-reduced-motion.
 */

export interface ToolGroup {
  label: string
  tools: string[]
}

const clients: { name: string; projects: { name: string; blocked?: boolean }[] }[] = [
  { name: 'Durand Construction', projects: [{ name: 'Quote generator' }, { name: 'Site reports' }] },
  { name: 'Batiplus', projects: [{ name: 'Tender scraper' }] },
  { name: 'Moreau Charpente', projects: [{ name: 'Email assistant', blocked: true }] },
]

const benefits = [
  'Access to every tool',
  'Spend tracked per client',
  'Alerts & auto-freeze',
  'Hashed, revocable keys',
  'Client reports & rebill',
  'Budgets & per-call caps',
]

// Geometry (viewBox units)
const W = 1200
const LEFT = { x: 40, w: 270, top: 95, gap: 24 }
const CENTER = { x: 450, w: 300, y: 70, h: 470 }
const RIGHT = { x: 880, w: 280, top: 80, gap: 24 }
const PILL = { x: CENTER.x + 24, w: CENTER.w - 48, h: 40, top: 184, step: 52 }
const MERGE_Y = 300
const BLOCKED_PILL = benefits.length - 1
const BLOCKED_Y = PILL.top + BLOCKED_PILL * PILL.step + PILL.h / 2

function layoutClients() {
  let y = LEFT.top
  return clients.map(client => {
    const h = 44 + client.projects.length * 40 + 8
    const card = {
      ...client,
      y,
      h,
      rows: client.projects.map((p, i) => ({ ...p, y: y + 44 + i * 40, cy: y + 44 + i * 40 + 16 })),
    }
    y += h + LEFT.gap
    return card
  })
}

function layoutGroups(groups: ToolGroup[]) {
  let y = RIGHT.top
  return groups.map(group => {
    const h = 42 + group.tools.length * 44 + 10
    const card = { ...group, y, h, cy: y + h / 2 }
    y += h + RIGHT.gap
    return card
  })
}

function Flow({ d, delay, blocked = false, id }: { d: string; delay: number; blocked?: boolean; id: string }) {
  const color = blocked ? 'stroke-red-500' : 'stroke-brand-green dark:stroke-brand-lime'
  return (
    <g>
      {/* The pipe */}
      <path d={d} fill="none" strokeWidth={10} strokeLinecap="round" className="stroke-olive-950/6 dark:stroke-white/8" />
      <path d={d} fill="none" strokeWidth={2} strokeLinecap="round" className="stroke-olive-950/10 dark:stroke-white/10" />
      {/* The liquid, with a soft glow and a lighter highlight riding on it */}
      <path
        d={d}
        fill="none"
        strokeWidth={10}
        strokeLinecap="round"
        filter={`url(#${id}-glow)`}
        className={clsx('liquid opacity-40', color)}
        style={{ animationDelay: `${delay}s` }}
      />
      <path
        d={d}
        fill="none"
        strokeWidth={5}
        strokeLinecap="round"
        className={clsx('liquid', color)}
        style={{ animationDelay: `${delay}s` }}
      />
      <path
        d={d}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        className={clsx('liquid-highlight', blocked ? 'stroke-red-200' : 'stroke-brand-lime dark:stroke-white/70')}
        style={{ animationDelay: `${delay - 0.2}s` }}
      />
      {/* Droplets travelling down the pipe */}
      <g className="motion-reduce:hidden">
        {[0, 1.3].map(offset => (
          <circle
            key={offset}
            r={4}
            className={blocked ? 'fill-red-500' : 'fill-brand-green dark:fill-brand-lime'}
          >
            <animateMotion dur="2.6s" repeatCount="indefinite" path={d} begin={`${delay + offset}s`} />
          </circle>
        ))}
      </g>
    </g>
  )
}

function Port({ x, y }: { x: number; y: number }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={6}
      strokeWidth={2.5}
      className="fill-white stroke-brand-green dark:fill-olive-900 dark:stroke-brand-lime"
    />
  )
}

function Monogram({ x, y, name }: { x: number; y: number; name: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} className="fill-brand-lime/25 dark:fill-brand-lime/15" />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        className="fill-brand-green font-sans text-[11px] font-semibold dark:fill-brand-lime"
      >
        {name.charAt(0)}
      </text>
    </g>
  )
}

export function FlowIllustration({ groups }: { groups: ToolGroup[] }) {
  const id = 'kflow'
  const clientCards = layoutClients()
  const groupCards = layoutGroups(groups)
  const bottom = Math.max(
    CENTER.y + CENTER.h,
    ...groupCards.map(g => g.y + g.h),
    ...clientCards.map(c => c.y + c.h),
  )
  const H = bottom + 60

  const inX = CENTER.x
  const outX = CENTER.x + CENTER.w
  const fromX = LEFT.x + LEFT.w

  const inFlows = clientCards.flatMap(c =>
    c.rows.map(row => {
      const endY = row.blocked ? BLOCKED_Y : MERGE_Y
      return {
        key: `${c.name}-${row.name}`,
        blocked: !!row.blocked,
        d: `M${fromX} ${row.cy} C ${fromX + 75} ${row.cy}, ${inX - 75} ${endY}, ${inX} ${endY}`,
      }
    }),
  )
  const outFlows = groupCards.map(g => ({
    key: g.label,
    d: `M${outX} ${MERGE_Y} C ${outX + 70} ${MERGE_Y}, ${RIGHT.x - 70} ${g.cy}, ${RIGHT.x} ${g.cy}`,
  }))

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[900px] font-sans"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>How keyone works</title>
        <desc id={`${id}-desc`}>
          Your agency’s client projects each call keyone with one project key. keyone handles access, spend tracking,
          alerts, key security, client reports, budgets and per-call caps, then routes calls to every tool in the
          catalog. A call over its budget is stopped at keyone.
        </desc>
        <defs>
          <filter id={`${id}-glow`} x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <filter id={`${id}-shadow`} x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#1a1a18" floodOpacity="0.08" />
          </filter>
          <linearGradient id={`${id}-halo`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#97c459" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#97c459" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Pipes and liquid (drawn first, under the cards) */}
        {inFlows.map((f, i) => (
          <Flow key={f.key} id={id} d={f.d} blocked={f.blocked} delay={-(i * 0.45)} />
        ))}
        {outFlows.map((f, i) => (
          <Flow key={f.key} id={id} d={f.d} delay={-1.1 - i * 0.45} />
        ))}

        {/* Left: your agency, its clients and their project keys */}
        <text
          x={LEFT.x}
          y={LEFT.top - 24}
          className="fill-brand-green font-mono text-[13px] font-semibold tracking-[0.2em] dark:fill-brand-lime"
        >
          YOUR AGENCY
        </text>
        {clientCards.map(c => (
          <g key={c.name}>
            <rect
              x={LEFT.x}
              y={c.y}
              width={LEFT.w}
              height={c.h}
              rx={14}
              filter={`url(#${id}-shadow)`}
              className="fill-white stroke-olive-950/10 dark:fill-olive-900 dark:stroke-white/10"
            />
            <text x={LEFT.x + 18} y={c.y + 28} className="fill-olive-950 text-[15px] font-semibold dark:fill-white">
              {c.name}
            </text>
            {c.rows.map(row => (
              <g key={row.name}>
                <rect
                  x={LEFT.x + 10}
                  y={row.y}
                  width={LEFT.w - 20}
                  height={32}
                  rx={8}
                  className={row.blocked ? 'fill-red-500/8' : 'fill-olive-950/4 dark:fill-white/5'}
                />
                <text x={LEFT.x + 22} y={row.cy + 5} className="fill-olive-700 text-[13px] dark:fill-olive-300">
                  {row.name}
                </text>
                <text
                  x={LEFT.x + LEFT.w - 22}
                  y={row.cy + 4}
                  textAnchor="end"
                  className={clsx(
                    'font-mono text-[11px]',
                    row.blocked ? 'fill-red-600 dark:fill-red-300' : 'fill-brand-green dark:fill-brand-lime',
                  )}
                >
                  kone_live_…
                </text>
                <Port x={fromX} y={row.cy} />
              </g>
            ))}
          </g>
        ))}
        <text
          x={LEFT.x + 18}
          y={clientCards[clientCards.length - 1].y + clientCards[clientCards.length - 1].h + 32}
          className="fill-olive-500 text-[13px]"
        >
          + every other client and project
        </text>

        {/* Center: keyone */}
        <rect
          x={CENTER.x - 18}
          y={CENTER.y - 18}
          width={CENTER.w + 36}
          height={CENTER.h + 36}
          rx={34}
          strokeDasharray="4 6"
          className="fill-none stroke-olive-950/10 dark:stroke-white/10"
        />
        <rect
          x={CENTER.x}
          y={CENTER.y}
          width={CENTER.w}
          height={CENTER.h}
          rx={26}
          filter={`url(#${id}-shadow)`}
          className="fill-white stroke-brand-green/40 dark:fill-olive-900 dark:stroke-brand-lime/30"
          strokeWidth={1.5}
        />
        <rect x={CENTER.x} y={CENTER.y} width={CENTER.w} height={140} rx={26} fill={`url(#${id}-halo)`} />
        <text
          x={CENTER.x + CENTER.w / 2}
          y={CENTER.y + 64}
          textAnchor="middle"
          className="fill-olive-950 font-display text-[44px] dark:fill-white"
        >
          keyone
        </text>
        <text
          x={CENTER.x + CENTER.w / 2}
          y={CENTER.y + 94}
          textAnchor="middle"
          className="fill-olive-500 font-mono text-[11px] tracking-[0.2em]"
        >
          ONE KEY PER CLIENT PROJECT
        </text>
        {benefits.map((b, i) => {
          const y = PILL.top + i * PILL.step
          const blocked = i === BLOCKED_PILL
          return (
            <g key={b}>
              <rect
                x={PILL.x}
                y={y}
                width={PILL.w}
                height={PILL.h}
                rx={PILL.h / 2}
                className="fill-olive-950/3 stroke-olive-950/10 dark:fill-white/5 dark:stroke-white/10"
              />
              {/* Each pill fills with liquid in turn; the budget pill flashes red as it stops a call */}
              <rect
                x={PILL.x}
                y={y}
                width={PILL.w}
                height={PILL.h}
                rx={PILL.h / 2}
                className={clsx(
                  'pill-glow',
                  blocked
                    ? 'fill-red-500/10 stroke-red-400/60'
                    : 'fill-brand-lime/20 stroke-brand-green/40 dark:fill-brand-lime/10',
                )}
                style={{ animationDelay: `${blocked ? 1.2 : i * 0.8}s` }}
              />
              <text
                x={PILL.x + PILL.w / 2}
                y={y + PILL.h / 2 + 5}
                textAnchor="middle"
                className="fill-olive-800 text-[14px] font-medium dark:fill-olive-200"
              >
                {b}
              </text>
            </g>
          )
        })}
        <Port x={inX} y={MERGE_Y} />
        <Port x={outX} y={MERGE_Y} />

        {/* A call over budget stops here */}
        <circle cx={inX} cy={BLOCKED_Y} r={7} className="blocked-pulse fill-red-500/40" />
        <circle cx={inX} cy={BLOCKED_Y} r={6} strokeWidth={2.5} className="fill-white stroke-red-500 dark:fill-olive-900" />
        <g transform={`translate(${inX - 172} ${BLOCKED_Y + 16})`}>
          <rect width={150} height={26} rx={13} className="fill-red-50 stroke-red-200 dark:fill-red-500/15 dark:stroke-red-400/30" />
          <text x={75} y={17} textAnchor="middle" className="fill-red-700 font-mono text-[11px] dark:fill-red-300">
            403 · budget reached
          </text>
        </g>

        {/* Right: every tool in the catalog */}
        <text
          x={RIGHT.x}
          y={RIGHT.top - 24}
          className="fill-brand-green font-mono text-[13px] font-semibold tracking-[0.2em] dark:fill-brand-lime"
        >
          EVERY TOOL
        </text>
        {groupCards.map(g => (
          <g key={g.label}>
            <rect
              x={RIGHT.x}
              y={g.y}
              width={RIGHT.w}
              height={g.h}
              rx={14}
              filter={`url(#${id}-shadow)`}
              className="fill-white stroke-olive-950/10 dark:fill-olive-900 dark:stroke-white/10"
            />
            <text x={RIGHT.x + 18} y={g.y + 28} className="fill-olive-950 text-[15px] font-semibold dark:fill-white">
              {g.label}
            </text>
            {g.tools.map((tool, i) => {
              const y = g.y + 42 + i * 44
              return (
                <g key={tool}>
                  <rect
                    x={RIGHT.x + 10}
                    y={y}
                    width={RIGHT.w - 20}
                    height={36}
                    rx={10}
                    className="fill-olive-950/4 dark:fill-white/5"
                  />
                  <Monogram x={RIGHT.x + 34} y={y + 18} name={tool} />
                  <text x={RIGHT.x + 54} y={y + 23} className="fill-olive-800 text-[13px] dark:fill-olive-200">
                    {tool}
                  </text>
                </g>
              )
            })}
            <Port x={RIGHT.x} y={g.cy} />
          </g>
        ))}
        <text
          x={RIGHT.x + 18}
          y={groupCards[groupCards.length - 1].y + groupCards[groupCards.length - 1].h + 32}
          className="fill-olive-500 text-[13px]"
        >
          + more tools every month
        </text>
      </svg>
    </div>
  )
}
