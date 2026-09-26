'use client'

import { formatUSD } from '@/lib/utils'

export interface BucketRow { key: string; name: string; calls: number; blocked: number; price_usd: number; rebill_usd: number }

export function BucketTable({ title, rows, linkFor }: { title: string; rows: BucketRow[]; linkFor?: (r: BucketRow) => string | null }) {
  return (
    <div>
      <div className="px-5 py-2 grid grid-cols-12 gap-3 text-2xs text-ink-subtle uppercase tracking-wider" style={{ borderBottom: '0.5px solid #e0ddd7' }}>
        <span className="col-span-5">{title}</span>
        <span className="col-span-2 text-right">Calls</span>
        <span className="col-span-3 text-right">Price</span>
        <span className="col-span-2 text-right">Rebill</span>
      </div>
      {rows.length === 0 ? (
        <div className="px-5 py-6 text-center text-xs text-ink-muted">Nothing in this range.</div>
      ) : rows.map((r, i) => {
        const href = linkFor?.(r) ?? null
        const Name = href ? <a href={href} className="hover:underline underline-offset-2">{r.name}</a> : <span>{r.name}</span>
        return (
          <div key={r.key} className="px-5 py-2.5 grid grid-cols-12 gap-3 text-sm items-center" style={i < rows.length - 1 ? { borderBottom: '0.5px solid #e0ddd7' } : undefined}>
            <span className="col-span-5 text-ink truncate">{Name}{r.blocked > 0 && <span className="ml-2 text-2xs text-amber-700">{r.blocked} blocked</span>}</span>
            <span className="col-span-2 text-right text-ink-muted text-xs tabular-nums">{r.calls}</span>
            <span className="col-span-3 text-right text-ink text-xs tabular-nums truncate">{formatUSD(r.price_usd, 4)}</span>
            <span className="col-span-2 text-right font-medium text-green-dark text-xs tabular-nums truncate">{formatUSD(r.rebill_usd, 4)}</span>
          </div>
        )
      })}
    </div>
  )
}
