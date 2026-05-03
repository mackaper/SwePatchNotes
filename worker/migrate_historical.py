"""
One-time migration: converts site-legacy cache + historical JSON to new schema.
Run from repo root: python3 worker/migrate_historical.py
"""
import json
import os
import time
import requests
from pathlib import Path
from utils import infer_status, get_tags, parse_beteckning, aggregate_votes

REPO_ROOT = Path(__file__).parent.parent
CACHE_FILE = REPO_ROOT / 'site-legacy' / '.cache' / 'summaries.json'
HISTORICAL_FILE = REPO_ROOT / 'site-legacy' / 'data' / 'historical_summaries.json'
OUT_DIR = REPO_ROOT / 'data' / 'betankanden'
API_BASE = 'https://data.riksdagen.se'


def fetch_doc_metadata(dok_id: str) -> dict | None:
    try:
        resp = requests.get(f"{API_BASE}/dokumentstatus/{dok_id}.json", timeout=30)
        if not resp.ok:
            return None
        data = resp.json().get('dokumentstatus', {})
        doc = data.get('dokument', {})
        return {
            'titel': doc.get('titel', ''),
            'datum': doc.get('datum', ''),
            'rm': doc.get('rm', ''),
            'beteckning': doc.get('beteckning', ''),
        }
    except Exception as e:
        print(f"  Metadata fetch error for {dok_id}: {e}")
        return None


def fetch_votes_for(rm: str, beteckning: str) -> dict:
    try:
        url = f"{API_BASE}/voteringlista/?rm={rm}&bet={beteckning}&punkt=1&utformat=json&sz=500"
        resp = requests.get(url, timeout=30)
        if not resp.ok:
            return {}
        votering = resp.json().get('voteringlista', {}).get('votering')
        if not votering:
            return {}
        if not isinstance(votering, list):
            votering = [votering]
        rost_map = {'Ja': 'ja', 'Nej': 'nej', 'Avstår': 'avstar', 'Frånvarande': 'franvarande'}
        valid = {'S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP', '-'}
        roster: dict = {}
        for v in votering:
            party = v.get('parti', '-').upper()
            if party not in valid:
                party = '-'
            if party not in roster:
                roster[party] = {'ja': 0, 'nej': 0, 'avstar': 0, 'franvarande': 0}
            key = rost_map.get(v.get('rost', ''), 'avstar')
            roster[party][key] += 1
        return roster
    except Exception as e:
        print(f"  Vote fetch error: {e}")
        return {}


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load cached LLM summaries
    cache: dict = {}
    if CACHE_FILE.exists():
        cache = json.loads(CACHE_FILE.read_text(encoding='utf-8'))
    print(f"Loaded {len(cache)} cached summaries")

    # Load old historical JSON (for vote data)
    historical: list = []
    if HISTORICAL_FILE.exists():
        historical = json.loads(HISTORICAL_FILE.read_text(encoding='utf-8'))
    historical_by_id = {h['id']: h for h in historical if not h['id'].startswith('DUMMY_')}
    print(f"Loaded {len(historical_by_id)} historical records")

    # Collect all dok_ids to migrate (union of cache + historical, skip DUMMY)
    all_ids = set(cache.keys()) | set(historical_by_id.keys())
    print(f"Total to migrate: {len(all_ids)}")

    for i, dok_id in enumerate(sorted(all_ids), 1):
        out_path = OUT_DIR / f"{dok_id}.json"
        if out_path.exists():
            print(f"[{i}/{len(all_ids)}] {dok_id} — already exists, skipping")
            continue

        print(f"[{i}/{len(all_ids)}] {dok_id}")

        # Get metadata from API
        time.sleep(0.3)
        meta = fetch_doc_metadata(dok_id)
        if not meta:
            print(f"  Could not fetch metadata, skipping")
            continue

        titel = meta['titel']
        datum = meta['datum']
        rm = meta['rm']
        beteckning = meta['beteckning']
        utskott, nummer = parse_beteckning(beteckning)

        # Get votes — prefer historical data (already fetched), fall back to API
        hist = historical_by_id.get(dok_id)
        if hist and hist.get('votes'):
            roster = aggregate_votes(hist['votes'])
        else:
            time.sleep(0.3)
            roster = fetch_votes_for(rm, beteckning)

        # Get summary from cache or use empty
        kort = cache.get(dok_id, '')
        if not kort and hist:
            kort = hist.get('summary', '')

        status = infer_status(titel)
        tags = get_tags(titel, kort)

        ja_total = sum(v['ja'] for v in roster.values())
        nej_total = sum(v['nej'] for v in roster.values())
        passed = ja_total > nej_total if roster else True

        voteringar = [{'party': p, **v} for p, v in roster.items()]

        detail = {
            'dok_id': dok_id,
            'titel': titel,
            'utskott': utskott,
            'nummer': nummer,
            'datum': datum,
            'rm': rm,
            'kort_sammanfattning': kort,
            'bakgrund': '',
            'beslut': '',
            'roster': roster,
            'tags': tags,
            'status': status,
            'passed': passed,
            'dokument_url': f"https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_{dok_id}",
            'voteringar': voteringar,
        }

        out_path.write_text(json.dumps(detail, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"  Saved → {out_path.name}")

    # Build index
    from build_index import build_index
    build_index(str(REPO_ROOT / 'data'))
    print("Migration complete.")


if __name__ == '__main__':
    main()
