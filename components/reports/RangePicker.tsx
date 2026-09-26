'use client'

export interface RangeState { range: 'this_month' | 'last_month' | 'custom'; from: string; to: string }

export function rangeQuery(r: RangeState): string {
  if (r.range === 'custom' && r.from) return `from=${r.from}&to=${r.to || r.from}`
  return `range=${r.range === 'custom' ? 'this_month' : r.range}`
}

export function RangePicker({ value, onChange }: { value: RangeState; onChange: (r: RangeState) => void }) {
  const btn = (id: RangeState['range'], label: string) => (
    <button
      key={id}
      onClick={() => onChange({ ...value, range: id })}
      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${value.range === id ? 'bg-ink text-bg' : 'text-ink-muted hover:text-ink border border-border'}`}
      style={{ borderWidth: '0.5px' }}
    >
      {label}
    </button>
  )
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {btn('this_month', 'This month')}
      {btn('last_month', 'Last month')}
      {btn('custom', 'Custom')}
      {value.range === 'custom' && (
        <>
          <input type="date" value={value.from} onChange={e => onChange({ ...value, from: e.target.value })} className="px-2 py-1 bg-bg border rounded text-xs text-ink outline-none" style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }} />
          <span className="text-xs text-ink-subtle">to</span>
          <input type="date" value={value.to} onChange={e => onChange({ ...value, to: e.target.value })} className="px-2 py-1 bg-bg border rounded text-xs text-ink outline-none" style={{ borderWidth: '0.5px', borderColor: '#e0ddd7' }} />
        </>
      )}
    </div>
  )
}
