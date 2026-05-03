"""
Daily data pipeline. Run: python worker/run.py [--riksmote 2025/26] [--dry-run]
Cron: 0 6 * * * cd /path/to/repo && python worker/run.py
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / '.env')

REPO_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(Path(__file__).parent))

from fetch_documents import fetch_betankande_ids, get_current_rm, get_document_text
from fetch_votes import fetch_votes
from summarize import summarize
from build_index import build_index
from utils import infer_status, get_tags, parse_beteckning

DATA_DIR = REPO_ROOT / 'data'
BETANKANDEN_DIR = DATA_DIR / 'betankanden'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--riksmote', default=None)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--force-resummarize', action='store_true')
    args = parser.parse_args()

    BETANKANDEN_DIR.mkdir(parents=True, exist_ok=True)
    existing = {p.stem for p in BETANKANDEN_DIR.glob('*.json')}
    rm = args.riksmote or get_current_rm()

    print(f"Riksmöte: {rm} | Existing: {len(existing)} | Dry run: {args.dry_run}")

    new_docs = fetch_betankande_ids(rm, existing)
    print(f"Found {len(new_docs)} new betänkanden")

    for doc in new_docs:
        dok_id = doc['dok_id']
        print(f"\nProcessing {dok_id}: {doc['titel'][:60]}")

        if args.dry_run:
            print("  [dry-run] skipping")
            continue

        time.sleep(1)
        roster = fetch_votes(doc['rm'], doc['beteckning'])

        time.sleep(1)
        text = get_document_text(dok_id)

        time.sleep(1)
        summary = summarize(doc['titel'], text, dok_id)

        utskott, nummer = parse_beteckning(doc['beteckning'])
        status = infer_status(doc['titel'])
        tags = get_tags(doc['titel'], summary['kort'])

        ja = sum(v['ja'] for v in roster.values())
        nej = sum(v['nej'] for v in roster.values())
        passed = ja > nej if roster else True

        detail = {
            'dok_id': dok_id,
            'titel': doc['titel'],
            'utskott': utskott,
            'nummer': nummer,
            'datum': doc['datum'],
            'rm': doc['rm'],
            'kort_sammanfattning': summary['kort'],
            'bakgrund': summary['bakgrund'],
            'beslut': summary['beslut'],
            'roster': roster,
            'tags': tags,
            'status': status,
            'passed': passed,
            'dokument_url': f"https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_{dok_id}",
            'voteringar': [{'party': p, **v} for p, v in roster.items()],
        }

        out = BETANKANDEN_DIR / f"{dok_id}.json"
        out.write_text(json.dumps(detail, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"  Saved {out.name}")

    if not args.dry_run:
        build_index(str(DATA_DIR))
        print("\nDone.")


if __name__ == '__main__':
    main()
