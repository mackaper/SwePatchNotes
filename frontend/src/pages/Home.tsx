import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { BetankandeIndex } from '../types'
import { fetchIndex } from '../lib/api'
import { search, initSearch } from '../lib/search'
import { SearchBar } from '../components/SearchBar'
import { BetankandeCard } from '../components/BetankandeCard'

const PAGE_SIZE = 20

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [items, setItems] = useState<BetankandeIndex[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const query = searchParams.get('q') ?? ''
  const hideAcclamation = searchParams.get('noack') !== 'false'

  useEffect(() => {
    fetchIndex()
      .then(data => {
        setItems(data)
        initSearch(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let result = query ? search(query, items) : items
    if (hideAcclamation) result = result.filter(i => i.roster && Object.keys(i.roster).length > 0)
    return result
  }, [items, query, hideAcclamation])

  const paginated = filtered.slice(0, page * PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 max-w-xs">
          <SearchBar value={query} onChange={v => {
            setPage(1)
            const next = new URLSearchParams(searchParams)
            v ? next.set('q', v) : next.delete('q')
            setSearchParams(next)
          }} />
        </div>
        <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={hideAcclamation}
            onChange={e => {
              setPage(1)
              const next = new URLSearchParams(searchParams)
              e.target.checked ? next.delete('noack') : next.set('noack', 'false')
              setSearchParams(next)
            }}
            className="rounded"
          />
          Dölj acklamation
        </label>
      </div>

      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 animate-pulse h-36" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-red-600 text-sm">Kunde inte ladda data: {error}</p>
      )}

      {!loading && !error && filtered.length === 0 && (
        <p className="text-center text-gray-400 py-12 text-sm">Inga betänkanden hittades.</p>
      )}

      <div className="space-y-4">
        {paginated.map(item => (
          <BetankandeCard key={item.dok_id} item={item} />
        ))}
      </div>

      {paginated.length < filtered.length && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-6 py-2 bg-[#003366] text-white text-sm font-medium rounded-lg hover:bg-blue-900 transition-colors"
          >
            Ladda fler ({filtered.length - paginated.length} kvar)
          </button>
        </div>
      )}
    </div>
  )
}
