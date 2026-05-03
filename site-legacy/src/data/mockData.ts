import { Decision, VoteResult } from '../types';

const votes: VoteResult[] = [
  { party: 'S', vote: 'Yes' },
  { party: 'V', vote: 'Yes' },
  { party: 'MP', vote: 'Yes' },
  { party: 'M', vote: 'No' },
  { party: 'KD', vote: 'No' },
  { party: 'SD', vote: 'No' },
  { party: 'C', vote: 'Abstain' },
  { party: 'L', vote: 'No' },
];

export const mockDecisions: Decision[] = [
  {
    id: '1',
    title: 'Nya energibidrag för hushåll',
    summary: 'Detta beslut innebär att hushåll med hög energiförbrukning kommer att få ett riktat bidrag för att täcka kostnader under vinterhalvåret. För dig som medborgare betyder det att om din elräkning överstiger en viss nivå, kan du ansöka om statligt stöd.',
    date: '2025-11-30',
    votes: votes,
    passed: false, // Based on the votes (S+V+MP is usually minority vs M+KD+SD+L) but let's say it failed for this example, or passed if we want. The prompt said "A passed law", so let's adjust votes to make it pass or just say it passed. Let's make C vote Yes.
  },
];

// Adjusting votes to make it pass for the example
const passedVotes: VoteResult[] = [
    { party: 'S', vote: 'Yes' },
    { party: 'V', vote: 'Yes' },
    { party: 'MP', vote: 'Yes' },
    { party: 'C', vote: 'Yes' }, // Kingmaker
    { party: 'M', vote: 'No' },
    { party: 'KD', vote: 'No' },
    { party: 'SD', vote: 'No' },
    { party: 'L', vote: 'No' },
];

mockDecisions[0].votes = passedVotes;
mockDecisions[0].passed = true;
