import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

const CACHE_DIR = path.join(process.cwd(), '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'summaries.json');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getCachedSummary(id: string): string | null {
  if (!fs.existsSync(CACHE_FILE)) return null;
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    return cache[id] || null;
  } catch (error) {
    console.error('Error reading cache:', error);
    return null;
  }
}

function saveCachedSummary(id: string, summary: string) {
  try {
    let cache: Record<string, string> = {};
    if (fs.existsSync(CACHE_FILE)) {
      cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
    cache[id] = summary;
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.error('Error writing cache:', error);
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ...existing code...
// Global queue to serialize API requests
// let requestChain = Promise.resolve();
const pendingRequests = new Map<string, Promise<string>>();

/*
async function scheduleRequest<T>(fn: () => Promise<T>): Promise<T> {
  const currentRequest = requestChain.then(async () => {
    await sleep(10000); // Enforce 10s delay between requests to avoid rate limits
    return fn();
  });
  
  // Catch errors so the chain doesn't break
  requestChain = currentRequest.catch(() => {});
  
  return currentRequest;
}
*/

export async function generateSummary(title: string, text: string, id: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY) {
    return 'Sammanfattning saknas (API-nyckel ej konfigurerad).';
  }

  // Check cache first
  const cached = getCachedSummary(id);
  if (cached) {
    console.log(`Using cached summary for ${id}`);
    return cached;
  }

  // Deduplicate concurrent requests for the same ID
  if (pendingRequests.has(id)) {
    console.log(`Request for ${id} already in progress, joining...`);
    return pendingRequests.get(id)!;
  }

  const promise = (async () => {
    console.log(`Generating new summary for ${id}...`);
    
    // Use gemini-2.0-flash as 1.5-flash seems unavailable for this key
// ...existing code...
    // ...existing code...
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
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
// ...existing code...
    const maxRetries = 5;
    let baseDelay = 5000;

    while (retries < maxRetries) {
      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const summary = response.text();

        if (summary) {
          saveCachedSummary(id, summary);
        }

        return summary || 'Kunde inte generera sammanfattning.';
      } catch (error: any) {
        const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('Too Many Requests') || error.message?.includes('Quota exceeded');
        
        if (isRateLimit) {
          retries++;
          const delay = baseDelay * Math.pow(2, retries - 1); // Exponential backoff
          console.warn(`Rate limit hit for ${id}. Retrying in ${delay}ms (Attempt ${retries}/${maxRetries})...`);
          await sleep(delay);
        } else {
          console.error('Error generating summary:', error);
          return `Kunde inte generera sammanfattning. Fel: ${error.message || 'Okänt fel'}`;
        }
      }
    }

    return 'Kunde inte generera sammanfattning (för många förfrågningar).';
  })();

  pendingRequests.set(id, promise);

  try {
    return await promise;
  } finally {
    pendingRequests.delete(id);
  }
}
