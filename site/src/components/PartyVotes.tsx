import React from 'react';
import { VoteResult, Party } from '../types';

const partyColors: Record<Party, string> = {
  S: 'bg-red-500',
  V: 'bg-red-700',
  MP: 'bg-green-500',
  M: 'bg-blue-600',
  KD: 'bg-blue-800',
  SD: 'bg-yellow-400 text-black',
  C: 'bg-green-700',
  L: 'bg-blue-400',
  '-': 'bg-gray-400',
};

interface PartyVotesProps {
  votes: VoteResult[];
  error?: boolean;
}

type GroupedVotes = Record<Party, number>;

export const PartyVotes: React.FC<PartyVotesProps> = ({ votes, error }) => {
  // Helper to group votes by party for a specific vote type (Yes/No/etc)
  const getPartyCounts = (voteType: VoteResult['vote']) => {
    const filtered = votes.filter((v) => v.vote === voteType);
    const counts: Partial<GroupedVotes> = {};
    filtered.forEach((v) => {
      counts[v.party] = (counts[v.party] || 0) + 1;
    });
    return counts;
  };

  const yesCounts = getPartyCounts('Yes');
  const noCounts = getPartyCounts('No');
  const abstainCounts = getPartyCounts('Abstain');
  // We can also track absent if needed, but usually less relevant for the "outcome" visualization

  const renderPartyBadges = (counts: Partial<GroupedVotes>) => {
    return Object.entries(counts).map(([party, count]) => (
      <div key={party} className="flex items-center mr-3 mb-2">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold mr-1 ${partyColors[party as Party] || 'bg-gray-400'}`}
          title={party}
        >
          {party}
        </span>
        <span className="text-xs font-medium text-gray-700">x {count}</span>
      </div>
    ));
  };

  const yesVotesCount = votes.filter((v) => v.vote === 'Yes').length;
  const noVotesCount = votes.filter((v) => v.vote === 'No').length;
  const abstainVotesCount = votes.filter((v) => v.vote === 'Abstain').length;
  const absentVotesCount = votes.filter((v) => v.vote === 'Absent').length;

  if (error) {
    return (
      <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-100 text-center">
        <h3 className="text-lg font-semibold text-red-900 mb-1">Kunde inte hämta röstningsdata</h3>
        <p className="text-red-700 text-sm">
          Ett fel uppstod vid hämtning av voteringen.
        </p>
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-1">Beslutades med acklamation</h3>
        <p className="text-blue-700 text-sm">
          Ingen votering krävdes. Alla partier var överens eller ingen begärde rösträkning.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Röstfördelning</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-green-700">Ja</span>
            <span className="text-xs text-green-600 font-mono">{yesVotesCount} röster</span>
          </div>
          <div className="flex flex-wrap">
            {renderPartyBadges(yesCounts)}
          </div>
        </div>

        <div className="bg-red-50 p-3 rounded-lg border border-red-100">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-red-700">Nej</span>
            <span className="text-xs text-red-600 font-mono">{noVotesCount} röster</span>
          </div>
          <div className="flex flex-wrap">
            {renderPartyBadges(noCounts)}
          </div>
        </div>
      </div>
      
      {abstainVotesCount > 0 && (
        <div className="mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
           <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-700">Avstår</span>
            <span className="text-xs text-gray-600 font-mono">{abstainVotesCount} röster</span>
          </div>
          <div className="flex flex-wrap">
            {renderPartyBadges(abstainCounts)}
          </div>
        </div>
      )}

      {absentVotesCount > 0 && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {absentVotesCount} ledamöter var frånvarande
        </div>
      )}
    </div>
  );
};
