import os
import json
import time

LOREM = {
    'kort': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'bakgrund': 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'beslut': 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
}

SYSTEM_PROMPT = """Du är en expert på svensk politik och riksdagsarbete. \
Din uppgift är att sammanfatta betänkanden på ett sätt som är lättförståeligt för vanliga medborgare. \
Var neutral och objektiv. Undvik värdeladdade ord.

Regler för "kort"-fältet:
- Nämn ALDRIG "riksdagen har beslutat", "riksdagen godkände" eller liknande — det vet läsaren redan.
- Förklara de konkreta förändringarna: vad som tillkommer, vad som tas bort, vad som ändras.
- Nämn specifika detaljer från texten — exempelvis vilka vapentyper, vilka bidragsbelopp, vilka yrkesgrupper, vilka tidsfrister osv.
- Om något ändras från ett värde till ett annat, skriv alltid ut båda: "kravet höjs från 5 till 8 år", "beloppet sänks från 25% till 20%". Utelämna aldrig det gamla värdet.
- Skriv i presens som om reglerna redan gäller: "Femårstillstånd för helautomatiska vapen slopas och ersätts med löpande tillsyn."
- Om beslutet innehåller flera distinkta konkreta förändringar (t.ex. en ny lag med flera regler): skriv varje förändring som en separat rad, separerade med \\n. Välj de 3-5 viktigaste.
- Om beslutet är en rapport, utredning eller skrivelse utan konkreta lagändringar: skriv en sammanhållen mening eller två som förklarar vad rapporten handlar om och vad slutsatsen är.
- Blanda inte formaten. Antingen löpande text ELLER rader separerade med \\n.
- Varje rad/mening ska tillföra ny konkret information.
- Exempel på BRA kort: "Femårstillstånden för helautomatiska vapen och enhandsvapen slopas och ersätts med ett tillsynsförfarande. Nya tillstånd för vissa halvautomatiska gevär för jakt förbjuds. Förvaringskraven görs samtidigt mer flexibla och EU:s förenklade regler för sportskyttar och jägare att föra in vapen införs."
- Exempel på DÅLIG kort: "Den nya vapenlagen innebär skärpta krav för vapenlicens och påverkar dig som äger vapen."

Svara ALLTID i JSON med exakt dessa tre nycklar:
{"kort": "Alla viktiga konkreta förändringar — utan att nämna riksdagen",
 "bakgrund": "1-2 meningar om varför frågan behandlades",
 "beslut": "1 mening om exakt vad riksdagen beslutade"}"""


def summarize(titel: str, text: str, dok_id: str) -> dict:
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print(f"  No GEMINI_API_KEY — using Lorem ipsum for {dok_id}")
        return LOREM

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    prompt = f"{SYSTEM_PROMPT}\n\nTitel: {titel}\n\nText:\n{text[:20000]}"

    raw = ''
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(temperature=0.2),
            )
            raw = response.text.strip()
            if raw.startswith('```'):
                parts = raw.split('```')
                raw = parts[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            return json.loads(raw.strip())
        except Exception as e:
            err = str(e)
            if '429' in err or 'quota' in err.lower() or 'rate' in err.lower():
                wait = 15 * (attempt + 1)
                print(f"  Rate limit for {dok_id}, waiting {wait}s (attempt {attempt + 1}/3)")
                time.sleep(wait)
            else:
                print(f"  Error for {dok_id}: {e}")
                try:
                    return json.loads(raw.strip())
                except Exception:
                    return {'kort': raw, 'bakgrund': '', 'beslut': ''}

    return {'kort': 'Kunde inte generera sammanfattning.', 'bakgrund': '', 'beslut': ''}
