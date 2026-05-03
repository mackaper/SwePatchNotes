require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_BASE = 'https://data.riksdagen.se';
const DATA_FILE = path.join(process.cwd(), 'data', 'historical_summaries.json');
const RMs = [
  '2025/26'
];

// Initialize LLM
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("No API key found in .env.local");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Ensure data directory exists
if (!fs.existsSync(path.dirname(DATA_FILE))) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Load existing data
let historicalData = [];
if (fs.existsSync(DATA_FILE)) {
  try {
    historicalData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`Loaded ${historicalData.length} existing records.`);
  } catch (e) {
    console.error("Error reading existing data file:", e);
  }
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function generateSummary(title, text, id) {
  const prompt = `Du är en hjälpsam assistent som sammanfattar politiska beslut för vanliga medborgare. 
    Din uppgift är att förklara vad beslutet innebär på enkel svenska.

    Fokusera på:
    - Vad innebär beslutet för en vanlig medborgare?
    - Vilka konkreta förändringar innebär det?

    Regler:
    - Var helt neutral och objektiv.
    - Undvik värdeladdade ord.
    - Håll det kort och koncist (max 3-4 meningar).
    - Börja direkt med sammanfattningen.
    - Upprepa INTE titeln i svaret.
    - Inled INTE svaret med titeln eller fetstilt text.

    Titel: ${title}

    Text: ${text.slice(0, 10000)}`;

  let retries = 0;
  const maxRetries = 5;
  let baseDelay = 5000;

  while (retries < maxRetries) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('Too Many Requests') || error.message?.includes('Quota exceeded');
      
      if (isRateLimit) {
        retries++;
        const delay = baseDelay * Math.pow(2, retries - 1);
        console.warn(`Rate limit hit for ${id}. Retrying in ${delay}ms (Attempt ${retries}/${maxRetries})...`);
        await sleep(delay);
      } else {
        console.error(`Error generating summary for ${id}:`, error.message);
        return null;
      }
    }
  }
  return null;
}

async function getVotesForDecision(rm, beteckning) {
  try {
    const response = await fetch(
        `${API_BASE}/voteringlista/?rm=${rm}&bet=${beteckning}&punkt=1&utformat=json&sz=500`
    );

    if (!response.ok) return { votes: [], error: true };

    const text = await response.text();
    if (!text) return { votes: [], error: true };

    let data;
    try {
        data = JSON.parse(text);
    } catch (e) {
        return { votes: [], error: true };
    }
    
    let votering = data.voteringlista.votering;
    if (!votering) return { votes: [], error: false };

    if (!Array.isArray(votering)) {
        votering = [votering];
    }

    const votes = votering.map((v) => {
        const party = v.parti.toUpperCase();
        return {
            party: party,
            vote: v.rost === 'Frånvarande' ? 'Absent' : v.rost === 'Avstår' ? 'Abstain' : v.rost === 'Ja' ? 'Yes' : 'No',
        };
    });

    return { votes, error: false };
  } catch (error) {
      return { votes: [], error: true };
  }
}

async function getDocumentText(dok_id) {
  try {
    const response = await fetch(`${API_BASE}/dokument/${dok_id}.text`);
    if (!response.ok) return '';
    return await response.text();
  } catch (error) {
    return '';
  }
}

async function processRm(rm) {
  console.log(`Processing RM: ${rm}`);
  // Fetch rskr (Riksdagsskrivelser)
  // Fetch a large batch to cover the year. 
  // Note: This is a simplified approach. Ideally we should paginate if there are > 500 decisions.
  // But usually rskr are not that many per year (maybe a few hundred).
  const url = `${API_BASE}/dokumentlista/?doktyp=rskr&utformat=json&rm=${rm}&sz=5`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch documents for RM ${rm}`);
      return;
    }

    const data = await response.json();
    if (!data.dokumentlista.dokument) {
      console.log(`No documents found for RM ${rm}`);
      return;
    }

    let documents = data.dokumentlista.dokument;
    if (!Array.isArray(documents)) {
      documents = [documents];
    }

    console.log(`Found ${documents.length} documents for RM ${rm}`);

    for (const doc of documents) {
      // Check if we already have this decision (by betänkande ID, which we don't know yet, or by rskr ID?)
      // The main ID we use in the app is the betänkande ID.
      // But we can't know it without fetching status.
      // However, we can check if we have processed this rskr ID before if we stored it.
      // For now, let's fetch status and check betId.

      try {
        const statusUrl = `${API_BASE}/dokumentstatus/${doc.dok_id}.json`;
        const statusResp = await fetch(statusUrl);
        if (!statusResp.ok) continue;

        const statusData = await statusResp.json();
        const refs = statusData.dokumentstatus?.dokreferens?.referens;
        
        if (!refs) continue;

        const refArray = Array.isArray(refs) ? refs : [refs];
        const betRef = refArray.find((r) => r.ref_dok_typ === 'bet');

        if (!betRef) continue;

        const betId = betRef.ref_dok_id;
        
        // Check if already processed
        if (historicalData.some(d => d.id === betId)) {
          // console.log(`Skipping ${betId} (already exists)`);
          continue;
        }

        const betRm = betRef.ref_dok_rm;
        const betBeteckning = betRef.ref_dok_bet;
        let betTitle = betRef.ref_dok_titel;

        if (!betTitle) {
            try {
              const betStatusUrl = `${API_BASE}/dokumentstatus/${betId}.json`;
              const betStatusResp = await fetch(betStatusUrl);
              if (betStatusResp.ok) {
                  const betStatusData = await betStatusResp.json();
                  betTitle = betStatusData.dokumentstatus?.dokument?.titel || '';
              }
            } catch (e) {}
        }

        console.log(`Processing ${betId}: ${betTitle}`);

        const { votes, error } = await getVotesForDecision(betRm, betBeteckning);
        const docText = await getDocumentText(betId);
        
        // Generate summary
        const summary = await generateSummary(betTitle, docText, betId);
        
        if (!summary) {
          console.warn(`Failed to generate summary for ${betId}, skipping.`);
          continue;
        }

        let passed = true;
        if (votes.length > 0) {
            const yes = votes.filter(v => v.vote === 'Yes').length;
            const no = votes.filter(v => v.vote === 'No').length;
            passed = yes > no;
        }

        const decision = {
          id: betId,
          title: betTitle,
          summary: summary,
          date: doc.publicerad,
          votes: votes,
          voteFetchError: error,
          passed: passed,
          rm: rm
        };

        historicalData.push(decision);
        
        // Save periodically
        fs.writeFileSync(DATA_FILE, JSON.stringify(historicalData, null, 2));
        
        // Sleep to be nice to APIs (10s to avoid rate limits)
        await sleep(10000); 

      } catch (e) {
        console.error(`Error processing document ${doc.dok_id}:`, e);
      }
    }

  } catch (e) {
    console.error(`Error processing RM ${rm}:`, e);
  }
}

async function main() {
  console.log("Starting historical data generation...");
  
  for (const rm of RMs) {
    await processRm(rm);
  }
  
  console.log("Done!");
}

main();
