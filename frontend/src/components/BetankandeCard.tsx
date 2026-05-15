import type { BetankandeIndex } from '../types'
import { VoteChart } from './VoteChart'
import { SubVotings } from './SubVotings'

interface Props {
  item: BetankandeIndex
}

export function BetankandeCard({ item }: Props) {

  return (
    <div id={item.dok_id} className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wide text-blue-600 bg-blue-50 rounded-md mb-2">
              Betänkande
            </span>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              {item.titel}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{item.datum.slice(0, 10)}</p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-bold shrink-0 ml-4 ${item.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {item.passed ? 'Beslutad' : 'Avslagen'}
          </div>
        </div>

        <div className="mb-6">
          {item.kort_sammanfattning.includes('\n') ? (
            <ul className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 space-y-1">
              {item.kort_sammanfattning.split('\n').filter(s => s.trim().length > 0).map((line, i) => (
                <li key={i} className="flex gap-2 text-gray-700 leading-relaxed">
                  <span className="text-yellow-500 mt-1 shrink-0">•</span>
                  <span>{line.trim()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-700 leading-relaxed bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
              {item.kort_sammanfattning}
            </p>
          )}
        </div>

        <VoteChart roster={item.roster} />

        {item.delvoterings && item.delvoterings.length > 0 && (
          <SubVotings delvoterings={item.delvoterings} />
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <a
            href={`https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_${item.dok_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition-colors"
          >
            Läs hela beslutet på riksdagen.se
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
            </svg>
          </a>
        </div>

      </div>
    </div>
  )
}
