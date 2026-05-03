import type { BetankandeIndex } from '../types'

interface Filters {
  utskott: string
  rm: string
  showAcclamation: boolean
  showRejected: boolean
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
  items: BetankandeIndex[]
}

export function FilterPanel({ filters, onChange, items }: Props) {
  const utskott = ['', ...Array.from(new Set(items.map(i => i.utskott))).sort()]
  const rms = ['', ...Array.from(new Set(items.map(i => i.rm))).sort((a, b) => b.localeCompare(a))]

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={filters.utskott}
        onChange={e => onChange({ ...filters, utskott: e.target.value })}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Alla utskott</option>
        {utskott.filter(Boolean).map(u => (
          <option key={u} value={u}>{u}</option>
        ))}
      </select>

      <select
        value={filters.rm}
        onChange={e => onChange({ ...filters, rm: e.target.value })}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Alla riksmöten</option>
        {rms.filter(Boolean).map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showAcclamation}
          onChange={e => onChange({ ...filters, showAcclamation: e.target.checked })}
          className="rounded"
        />
        Visa acklamation
      </label>

      <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.showRejected}
          onChange={e => onChange({ ...filters, showRejected: e.target.checked })}
          className="rounded"
        />
        Visa avslagna
      </label>
    </div>
  )
}
