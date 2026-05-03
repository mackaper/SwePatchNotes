import type { PartyVotes } from '../types'

const partyColors: Record<string, string> = {
  S: 'bg-red-500 text-white',
  V: 'bg-red-700 text-white',
  MP: 'bg-green-500 text-white',
  M: 'bg-blue-600 text-white',
  KD: 'bg-blue-800 text-white',
  SD: 'bg-yellow-400 text-black',
  C: 'bg-green-700 text-white',
  L: 'bg-blue-400 text-white',
  '-': 'bg-gray-400 text-white',
}

interface Props {
  roster: Record<string, PartyVotes>
}

export function VoteChart({ roster }: Props) {
  if (!roster || Object.keys(roster).length === 0) {
    return (
      <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">Beslutades med acklamation</h3>
        <p className="text-blue-700 text-sm">
          Ingen votering krävdes. Alla partier var överens eller ingen begärde rösträkning.
        </p>
      </div>
    )
  }

  // Aggregate totals and per-party counts for ja/nej/avstar
  let jaTotal = 0, nejTotal = 0, avstarTotal = 0, franvarandeTotal = 0
  const jaCounts: Record<string, number> = {}
  const nejCounts: Record<string, number> = {}
  const avstarCounts: Record<string, number> = {}

  for (const [party, v] of Object.entries(roster)) {
    if (v.ja > 0) jaCounts[party] = v.ja
    if (v.nej > 0) nejCounts[party] = v.nej
    if (v.avstar > 0) avstarCounts[party] = v.avstar
    jaTotal += v.ja
    nejTotal += v.nej
    avstarTotal += v.avstar
    franvarandeTotal += v.franvarande
  }

  const renderBadges = (counts: Record<string, number>) =>
    Object.entries(counts).map(([party, count]) => (
      <div key={party} className="flex items-center mr-3 mb-2">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold mr-1 ${partyColors[party] ?? 'bg-gray-400 text-white'}`}>
          {party}
        </span>
        <span className="text-xs font-medium text-gray-700">x {count}</span>
      </div>
    ))

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Röstfördelning</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-green-700">Ja</span>
            <span className="text-xs text-green-600 font-mono">{jaTotal} röster</span>
          </div>
          <div className="flex flex-wrap">{renderBadges(jaCounts)}</div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-red-700">Nej</span>
            <span className="text-xs text-red-600 font-mono">{nejTotal} röster</span>
          </div>
          <div className="flex flex-wrap">{renderBadges(nejCounts)}</div>
        </div>
      </div>

      {avstarTotal > 0 && (
        <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-700">Avstår</span>
            <span className="text-xs text-gray-600 font-mono">{avstarTotal} röster</span>
          </div>
          <div className="flex flex-wrap">{renderBadges(avstarCounts)}</div>
        </div>
      )}

      {franvarandeTotal > 0 && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {franvarandeTotal} ledamöter var frånvarande
        </div>
      )}
    </div>
  )
}
