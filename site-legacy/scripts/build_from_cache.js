// Builds historical_summaries.json from already-cached summaries in .cache/summaries.json
// No LLM calls — just fetches metadata from the Riksdag API.
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://data.riksdagen.se';
const CACHE_FILE = path.join(process.cwd(), '.cache', 'summaries.json');
const DATA_FILE = path.join(process.cwd(), 'data', 'historical_summaries.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getVotes(rm, beteckning) {
  if (!rm || !beteckning) return { votes: [], error: false };
  try {
    const res = await fetch(`${API_BASE}/voteringlista/?rm=${rm}&bet=${beteckning}&punkt=1&utformat=json&sz=500`);
    if (!res.ok) return { votes: [], error: true };
    const text = await res.text();
    if (!text) return { votes: [], error: true };
    const data = JSON.parse(text);
    let votering = data.voteringlista.votering;
    if (!votering) return { votes: [], error: false };
    if (!Array.isArray(votering)) votering = [votering];
    const votes = votering.map(v => ({
      party: v.parti.toUpperCase(),
      vote: v.rost === 'Frånvarande' ? 'Absent' : v.rost === 'Avstår' ? 'Abstain' : v.rost === 'Ja' ? 'Yes' : 'No',
    }));
    return { votes, error: false };
  } catch { return { votes: [], error: true }; }
}

async function main() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error('No .cache/summaries.json found');
    process.exit(1);
  }

  const llmCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
  const cachedIds = Object.keys(llmCache);
  console.log(`Found ${cachedIds.length} cached summaries`);

  let historical = [];
  if (fs.existsSync(DATA_FILE)) {
    historical = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    console.log(`Loaded ${historical.length} existing historical records`);
  }
  const existingIds = new Set(historical.map(d => d.id));

  for (const betId of cachedIds) {
    if (existingIds.has(betId)) {
      console.log(`Skipping ${betId} (already in historical data)`);
      continue;
    }

    console.log(`Fetching metadata for ${betId}...`);
    try {
      const res = await fetch(`${API_BASE}/dokumentstatus/${betId}.json`);
      if (!res.ok) { console.warn(`  Failed to fetch status for ${betId}`); continue; }
      const data = await res.json();
      const dok = data.dokumentstatus?.dokument;
      if (!dok) { console.warn(`  No dokument for ${betId}`); continue; }

      const title = dok.titel || '';
      const rm = dok.rm || '';
      const beteckning = dok.beteckning || '';
      const datum = dok.datum || dok.publicerad || '';

      // Find rskr date (more accurate publication date)
      let date = datum;
      const refs = data.dokumentstatus?.dokreferens?.referens;
      if (refs) {
        const refArray = Array.isArray(refs) ? refs : [refs];
        const rskrRef = refArray.find(r => r.ref_dok_typ === 'rskr');
        if (rskrRef?.ref_dok_datum) date = rskrRef.ref_dok_datum;
      }

      await sleep(300);
      const { votes, error } = await getVotes(rm, beteckning);

      let passed = true;
      if (votes.length > 0) {
        const yes = votes.filter(v => v.vote === 'Yes').length;
        const no = votes.filter(v => v.vote === 'No').length;
        passed = yes > no;
      }

      const entry = { id: betId, title, summary: llmCache[betId], date, votes, voteFetchError: error, passed, rm, beteckning };
      historical.push(entry);
      existingIds.add(betId);
      fs.writeFileSync(DATA_FILE, JSON.stringify(historical, null, 2));
      console.log(`  ✓ ${title.slice(0, 60)}`);
      await sleep(500);
    } catch (e) {
      console.error(`  Error processing ${betId}:`, e.message);
    }
  }

  console.log(`\nDone. ${historical.length} total entries in historical_summaries.json`);
}

main();
