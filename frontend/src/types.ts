export type Party = 'S' | 'M' | 'SD' | 'C' | 'V' | 'KD' | 'L' | 'MP' | '-';
export type DecisionStatus = 'NY' | 'ÄNDRAD' | 'UPPHÄVD';

export interface PartyVotes {
  ja: number;
  nej: number;
  avstar: number;
  franvarande: number;
}

export interface BetankandeIndex {
  dok_id: string;
  titel: string;
  utskott: string;
  nummer: number;
  datum: string;
  rm: string;
  kort_sammanfattning: string;
  roster: Record<string, PartyVotes>;
  tags: string[];
  status: DecisionStatus;
  passed: boolean;
}

export interface VoteringDetail {
  party: string;
  ja: number;
  nej: number;
  avstar: number;
  franvarande: number;
}

export interface BetankandeDetail extends BetankandeIndex {
  bakgrund: string;
  beslut: string;
  dokument_url: string;
  voteringar: VoteringDetail[];
}
