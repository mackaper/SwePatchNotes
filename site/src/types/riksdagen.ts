export interface RiksdagenDocument {
  dok_id: string;
  rm: string;
  beteckning: string;
  titel: string;
  subtitel: string;
  doktyp: string;
  publicerad: string;
  beslutad: string; // "1" om beslutad
  summary?: string;
}

export interface RiksdagenVote {
  votering_id: string;
  punkt: string;
  namn: string;
  parti: string;
  rost: 'Ja' | 'Nej' | 'Avstår' | 'Frånvarande';
}

export interface RiksdagenVoteResponse {
  voteringlista: {
    votering: RiksdagenVote[] | RiksdagenVote | null; // Can be null if no votes, or single object
  };
}

export interface RiksdagenDokumentListaResponse {
  dokumentlista: {
    '@traffar': string;
    dokument: RiksdagenDocument[] | RiksdagenDocument;
  };
}
