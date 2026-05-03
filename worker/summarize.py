import os
import json
import time

LOREM = {
    'kort': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'bakgrund': 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'beslut': 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
}

SYSTEM_PROMPT = """Du är en expert på svensk politik och riksdagsarbete. \
Din uppgift är att sammanfatta betänkanden på ett sätt som är lättförståeligt \
för vanliga medborgare. Var neutral och objektiv. Undvik värdeladdade ord. \
Svara ALLTID i JSON med exakt dessa tre nycklar:
{"kort": "2-3 meningar om vad beslutet innebär för en vanlig medborgare",
 "bakgrund": "1-2 meningar om varför riksdagen behandlade frågan",
 "beslut": "1 mening om exakt vad riksdagen beslutade"}"""


def summarize(titel: str, text: str, dok_id: str) -> dict:
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        print(f"  No GEMINI_API_KEY — using Lorem ipsum for {dok_id}")
        return LOREM

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    prompt = f"{SYSTEM_PROMPT}\n\nTitel: {titel}\n\nText:\n{text[:10000]}"

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
