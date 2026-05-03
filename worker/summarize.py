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
    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print(f"  No ANTHROPIC_API_KEY — using Lorem ipsum for {dok_id}")
        return LOREM

    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    prompt = f"Titel: {titel}\n\nText:\n{text[:10000]}"

    for attempt in range(5):
        try:
            msg = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = msg.content[0].text.strip()
            if raw.startswith('```'):
                parts = raw.split('```')
                raw = parts[1]
                if raw.startswith('json'):
                    raw = raw[4:]
            return json.loads(raw.strip())
        except anthropic.RateLimitError:
            wait = 2 ** attempt
            print(f"  Rate limit for {dok_id}, waiting {wait}s (attempt {attempt + 1}/5)")
            time.sleep(wait)
        except json.JSONDecodeError as e:
            print(f"  JSON parse error for {dok_id}: {e}")
            return {'kort': raw, 'bakgrund': '', 'beslut': ''}
        except Exception as e:
            print(f"  Summarize error for {dok_id}: {e}")
            return LOREM

    return {'kort': 'Kunde inte generera sammanfattning.', 'bakgrund': '', 'beslut': ''}
