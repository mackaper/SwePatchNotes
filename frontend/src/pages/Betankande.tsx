import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { BetankandeDetail } from '../types'
import { fetchDetail } from '../lib/api'
import { VoteChart } from '../components/VoteChart'
import { formatBetRef } from '../lib/formatters'

const STATUS_STYLES = {
  NY: 'bg-emerald-100 text-emerald-800',
  ÄNDRAD: 'bg-orange-100 text-orange-800',
  UPPHÄVD: 'bg-red-100 text-red-800',
}

export default function Betankande() {
  const { dok_id } = useParams<{ dok_id: string }>()
  const [item, setItem] = useState<BetankandeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dok_id) return
    fetchDetail(dok_id)
      .then(setItem)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [dok_id])

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-3/4" /><div className="h-32 bg-gray-200 rounded" /></div>
  }

  if (error || !item) {
    return <p className="text-red-600 text-sm">Kunde inte ladda betänkandet: {error}</p>
  }

  const betRef = formatBetRef(item.rm, item.utskott + item.nummer)

  return (
    <div className="max-w-2xl">
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-6">
        ← Tillbaka
      </Link>

      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[item.status] ?? STATUS_STYLES.NY}`}>
          {item.status}
        </span>
        {betRef && <span className="text-xs text-gray-400 font-mono">{betRef}</span>}
        {item.tags.map(tag => (
          <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{tag}</span>
        ))}
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {item.passed ? 'Beslutad' : 'Avslagen'}
        </span>
      </div>

      <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">{item.titel}</h1>
      <p className="text-sm text-gray-400 mb-6">{item.datum} · {item.rm}</p>

      <div className="space-y-4 mb-8">
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Kortfattat</h2>
          <p className="text-sm text-gray-700 leading-relaxed bg-amber-50 border-l-4 border-amber-400 px-3 py-2 rounded-r">
            {item.kort_sammanfattning}
          </p>
        </section>

        {item.bakgrund && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Bakgrund</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{item.bakgrund}</p>
          </section>
        )}

        {item.beslut && (
          <section>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Beslut</h2>
            <p className="text-sm text-gray-700 leading-relaxed">{item.beslut}</p>
          </section>
        )}
      </div>

      <section className="mb-8">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Röstning per parti</h2>
        <VoteChart roster={item.roster} />
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Ja</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Nej</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-300 inline-block" /> Avstår</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-100 border inline-block" /> Frånv.</span>
        </div>
      </section>

      <a
        href={item.dokument_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
      >
        Läs hela betänkandet på riksdagen.se →
      </a>
    </div>
  )
}
