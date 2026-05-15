import { useState } from 'react'
import type { Delvotering } from '../types'
import { VoteChart } from './VoteChart'

const CLOSE_MARGIN = 10

interface Props {
  delvoterings: Delvotering[]
}

function margin(d: Delvotering) {
  return Math.abs(d.ja - d.nej)
}

export function SubVotings({ delvoterings }: Props) {
  const [expandedClose, setExpandedClose] = useState<string | null>(null)
  const [expandedPunkt, setExpandedPunkt] = useState<string | null>(null)
  const [listExpanded, setListExpanded] = useState(false)

  if (!delvoterings || delvoterings.length === 0) return null

  const close = delvoterings.filter(d => margin(d) <= CLOSE_MARGIN)
  const rest = delvoterings.filter(d => margin(d) > CLOSE_MARGIN)

  return (
    <div className="mt-6 border-t border-gray-100 pt-4">
      {close.map(d => (
        <div key={d.punkt} className="mb-4 rounded-lg border border-orange-200 bg-orange-50 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-orange-100 transition-colors"
            onClick={() => setExpandedClose(expandedClose === d.punkt ? null : d.punkt)}
          >
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2">
                <span className="text-orange-500 font-bold text-sm">⚠ Jämn votering</span>
                <span className="text-xs text-orange-600 font-mono bg-orange-100 px-2 py-0.5 rounded-full">
                  {d.ja}–{d.nej}, marginal {margin(d)}
                </span>
              </div>
              <span className="text-sm text-gray-700 font-medium">{d.rubrik}</span>
            </div>
            <span className="text-orange-400 text-xs ml-2">{expandedClose === d.punkt ? '▲' : '▼'}</span>
          </button>
          {expandedClose === d.punkt && (
            <div className="px-4 pb-4">
              <VoteChart roster={d.roster} />
            </div>
          )}
        </div>
      ))}

      {rest.length > 0 && (
        <div>
          <button
            onClick={() => setListExpanded(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className={`transition-transform ${listExpanded ? 'rotate-90' : ''}`}>▶</span>
            {listExpanded ? 'Dölj' : 'Visa'} övriga voteringar i ärendet ({rest.length})
          </button>

          {listExpanded && (
            <div className="mt-2 rounded-lg border border-gray-100 divide-y divide-gray-100">
              {rest.map(d => (
                <div key={d.punkt}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedPunkt(expandedPunkt === d.punkt ? null : d.punkt)}
                  >
                    <span className="text-sm text-gray-700 pr-4">{d.rubrik}</span>
                    <span className="text-sm font-mono text-gray-500 shrink-0">
                      {d.ja}–{d.nej}
                      <span className="ml-2 text-gray-300">{expandedPunkt === d.punkt ? '▲' : '▼'}</span>
                    </span>
                  </button>
                  {expandedPunkt === d.punkt && (
                    <div className="px-4 pb-4">
                      <VoteChart roster={d.roster} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
