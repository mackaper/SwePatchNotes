import { Decision, VoteResult, Party } from '../types';
import { RiksdagenDokumentListaResponse, RiksdagenVoteResponse, RiksdagenDocument } from '../types/riksdagen';
import { generateSummary } from './llm';
import fs from 'fs';
import path from 'path';

const API_BASE = 'https://data.riksdagen.se';
const HISTORICAL_DATA_PATH = path.join(process.cwd(), 'data', 'historical_summaries.json');

function getHistoricalData(): Decision[] {
  if (!fs.existsSync(HISTORICAL_DATA_PATH)) return [];
  try {
    const data = fs.readFileSync(HISTORICAL_DATA_PATH, 'utf-8');
    return JSON.parse(data) as Decision[];
  } catch (e) {
    console.error('Failed to load historical data', e);
    return [];
  }
}

function getCurrentRm(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  
  // Riksmöte starts in September (month 8) usually.
  // If month < 8 (Jan-Aug), we are in the second half of the previous year's session.
  let startYear = year;
  if (month < 8) {
    startYear = year - 1;
  }
  
  const endYear = (startYear + 1) % 100;
  return `${startYear}/${endYear}`;
}

export async function getLatestDecisions(limit = 5, from?: string, to?: string): Promise<Decision[]> {
  return getHistoricalData();

  // 1. Hämta riksdagsskrivelser (rskr) - dessa bekräftar att beslut tagits
  const rm = getCurrentRm();
  // Fetch more documents to ensure we find enough unique decisions
  const fetchSize = Math.max(limit * 5, 50);
  
  let url = `${API_BASE}/dokumentlista/?doktyp=rskr&utformat=json&p=1&sz=${fetchSize}`;
  
  if (from && to) {
      url += `&from=${from}&tom=${to}`;
  } else {
      // Default to current RM if no date range is specified
      url += `&rm=${rm}`;
  }

  const response = await fetch(
    url,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );
  
  if (!response.ok) {
    console.error('Failed to fetch decisions from Riksdagen API');
    return [];
  }

  const data: RiksdagenDokumentListaResponse = await response.json();
  
  console.log('Fetched rskr for RM:', rm);

  // Ensure we have documents
  if (!data.dokumentlista.dokument) {
      console.log('No documents found');
      return [];
  }

  let documents = data.dokumentlista.dokument;
  if (!Array.isArray(documents)) {
      documents = [documents as RiksdagenDocument];
  }

  // Use all fetched documents as candidates
  const candidateDocuments = documents as RiksdagenDocument[];

  const decisions: Decision[] = [];
  const historicalData = getHistoricalData();

  for (const doc of candidateDocuments) {
    // Stop if we have enough decisions with votes, or if we have too many total decisions (safety break)
    const decisionsWithVotes = decisions.filter(d => d.votes.length > 0).length;
    if (decisionsWithVotes >= limit) break;
    if (decisions.length >= limit * 3) break; // Safety break to avoid too many acclamation decisions

    try {
      // Fetch document status to find the related betänkande
      const statusUrl = `${API_BASE}/dokumentstatus/${doc.dok_id}.json`;
      const statusResp = await fetch(statusUrl, { next: { revalidate: 3600 * 24 } });
      if (!statusResp.ok) continue;

      const statusData = await statusResp.json();
      const refs = statusData.dokumentstatus?.dokreferens?.referens;
      
      if (!refs) continue;

      const refArray = Array.isArray(refs) ? refs : [refs];
      // Find the betänkande
      // Type assertion to any because we haven't fully typed the status response
      const betRef = refArray.find((r: any) => r.ref_dok_typ === 'bet');

      if (!betRef) continue;

      // Found a related betänkande!
      const betId = betRef.ref_dok_id;
      const betRm = betRef.ref_dok_rm;
      const betBeteckning = betRef.ref_dok_bet;
      let betTitle = betRef.ref_dok_titel;

      // If title is missing in reference, fetch it from the betänkande document
      if (!betTitle) {
          try {
            const betStatusUrl = `${API_BASE}/dokumentstatus/${betId}.json`;
            const betStatusResp = await fetch(betStatusUrl, { next: { revalidate: 3600 * 24 } });
            if (betStatusResp.ok) {
                const betStatusData = await betStatusResp.json();
                betTitle = betStatusData.dokumentstatus?.dokument?.titel || '';
            }
          } catch (e) {
              console.warn(`Failed to fetch title for ${betId}`, e);
          }
      }
      // Check if we already added this decision (multiple rskr might point to same bet)
      if (decisions.some(d => d.id === betId)) continue;

      // Check if we have this decision in our generated historical data
      const historicalDecision = historicalData.find(d => d.id === betId);
      if (historicalDecision) {
        // Use the pre-generated data!
        decisions.push(historicalDecision);
        continue;
      }

      const { votes, error } = await getVotesForDecision(betRm, betBeteckning);
      
      // Hämta dokumenttext för sammanfattning (från betänkandet)
      const docText = await getDocumentText(betId);
      
      const summary = await generateSummary(betTitle, docText, betId);

      let passed = true;
      if (votes.length > 0) {
          const yes = votes.filter(v => v.vote === 'Yes').length;
          const no = votes.filter(v => v.vote === 'No').length;
          passed = yes > no;
      }

      decisions.push({
        id: betId, // Use betänkande ID as the decision ID
        title: betTitle,
        summary: summary,
        date: doc.publicerad, // Use rskr date as the decision date
        votes: votes,
        voteFetchError: error,
        passed: passed,
      });
    } catch (e) {
      console.error(`Error processing rskr ${doc.dok_id}:`, e);
    }
  }

  return decisions;
}

async function getVotesForDecision(rm: string, beteckning: string): Promise<{ votes: VoteResult[], error: boolean }> {
  // Hämta votering. Vi tar bara första punkten (punkt 1) för enkelhetens skull i MVP
  // Often the main decision is point 1.
  try {
    const response = await fetch(
        `${API_BASE}/voteringlista/?rm=${rm}&bet=${beteckning}&punkt=1&utformat=json&sz=500`,
        { next: { revalidate: 3600 } }
    );

    if (!response.ok) return { votes: [], error: true };

    // The API might return text/html if something goes wrong or empty, so be careful parsing JSON
    const text = await response.text();
    if (!text) return { votes: [], error: true };

    let data: RiksdagenVoteResponse;
    try {
        data = JSON.parse(text);
    } catch (e) {
        console.warn(`Failed to parse JSON for votes ${rm} ${beteckning}`, e);
        return { votes: [], error: true };
    }
    
    // API:et kan returnera null om ingen votering skedde (t.ex. acklamation)
    let votering = data.voteringlista.votering;
    if (!votering) return { votes: [], error: false };

    if (!Array.isArray(votering)) {
        votering = [votering];
    }

    // Mappa om till vårt format
    const votes = votering.map((v) => {
        const party = v.parti.toUpperCase();
        // Handle potential edge cases in party names if necessary, but usually they are S, M, etc.
        // Ensure it matches our Party type
        const validParties: Party[] = ['S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP', '-'];
        if (!validParties.includes(party as Party)) {
            // Fallback or handle independent MPs ('-')
            // For now, we might skip or cast. Let's just cast and maybe filter in UI if needed.
        }

        return {
            party: party as Party,
            vote: v.rost === 'Frånvarande' ? 'Absent' : v.rost === 'Avstår' ? 'Abstain' : v.rost === 'Ja' ? 'Yes' : 'No',
        } as VoteResult;
    });

    return { votes, error: false };
  } catch (error) {
      console.error(`Error fetching votes for ${rm} ${beteckning}:`, error);
      return { votes: [], error: true };
  }
}

async function getDocumentText(dok_id: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/dokument/${dok_id}.text`, {
        next: { revalidate: 3600 * 24 } // Cache text for 24 hours
    });
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch text for document ${dok_id}`, error);
    return '';
  }
}
