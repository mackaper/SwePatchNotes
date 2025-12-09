'use client';

import { useSearchParams } from 'next/navigation';
import { Decision } from '../types';
import { DecisionCard } from './DecisionCard';

interface DecisionListProps {
  decisions: Decision[];
}

export function DecisionList({ decisions }: DecisionListProps) {
  const searchParams = useSearchParams();
  const showAcclamation = searchParams.get('acclamation') === 'true';
  const showRejected = searchParams.get('rejected') === 'true';

  const filteredDecisions = decisions.filter((decision) => {
    // Filter out rejected decisions unless showRejected is true
    if (!showRejected && !decision.passed) return false;

    if (showAcclamation) return true;
    // Hide decisions with no votes (acclamation)
    return decision.votes.length > 0;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-8">
        {filteredDecisions.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Inga beslut att visa med valda filter.</p>
        ) : (
          filteredDecisions.map((decision) => (
            <DecisionCard key={decision.id} decision={decision} />
          ))
        )}
      </div>
    </div>
  );
}
