export type Party = 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP' | '-';

export interface VoteResult {
  party: Party;
  vote: 'Yes' | 'No' | 'Abstain' | 'Absent';
}

export interface Decision {
  id: string;
  title: string;
  summary: string; // LLM generated summary
  date: string;
  votes: VoteResult[];
  voteFetchError?: boolean;
  passed: boolean;
}
