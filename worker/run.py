"""
Daily data pipeline. Run: python worker/run.py [--riksmote 2025/26] [--dry-run] [--retry-failed]
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
from fetch_votes import fetch_votes, fetch_all_punkter
from summarize import summarize
from build_index import build_index
from utils import infer_status, get_tags, parse_beteckning

DATA_DIR = REPO_ROOT / 'data'
BETANKANDEN_DIR = DATA_DIR / 'betankanden'

FAILED_MARKER = 'Kunde inte generera sammanfattning'


def process_doc(dok_id, titel, rm, beteckning, datum):
    time.sleep(1)
    roster = fetch_votes(rm, beteckning)

    delvoterings = fetch_all_punkter(rm, beteckning, dok_id)
    if delvoterings:
        print(f"  {len(delvoterings)} delvoterings found")

    time.sleep(1)
    text = get_document_text(dok_id)

    time.sleep(20)
    summary = summarize(titel, text, dok_id)

    utskott, nummer = parse_beteckning(beteckning)
    status = infer_status(titel)
    tags = get_tags(titel, summary['kort'])

    ja = sum(v['ja'] for v in roster.values())
    nej = sum(v['nej'] for v in roster.values())
    passed = ja > nej if roster else True

    return {
        'dok_id': dok_id,
        'titel': titel,
        'utskott': utskott,
        'nummer': nummer,
        'datum': datum,
        'rm': rm,
        'kort_sammanfattning': summary['kort'],
        'bakgrund': summary['bakgrund'],
        'beslut': summary['beslut'],
        'roster': roster,
        'tags': tags,
        'status': status,
        'passed': passed,
        'dokument_url': f"https://www.riksdagen.se/sv/dokument-och-lagar/dokument/betankande/_{dok_id}",
        'voteringar': [{'party': p, **v} for p, v in roster.items()],
        'delvoterings': delvoterings,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--riksmote', default=None)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--retry-failed', action='store_true',
                        help='Re-summarize decisions where summarization previously failed')
    args = parser.parse_args()

    BETANKANDEN_DIR.mkdir(parents=True, exist_ok=True)
    rm = args.riksmote or get_current_rm()

    if args.retry_failed:
        failed = []
        for path in sorted(BETANKANDEN_DIR.glob('*.json')):
            detail = json.loads(path.read_text(encoding='utf-8'))
            if FAILED_MARKER in detail.get('kort_sammanfattning', ''):
                failed.append(detail)
        print(f"Retrying {len(failed)} failed summaries")
        for detail in failed:
            dok_id = detail['dok_id']
            print(f"\nRetrying {dok_id}: {detail['titel'][:60]}")
            if args.dry_run:
                print("  [dry-run] skipping")
                continue
            time.sleep(20)
            text = get_document_text(dok_id)
            summary = summarize(detail['titel'], text, dok_id)
            if FAILED_MARKER not in summary['kort']:
                detail['kort_sammanfattning'] = summary['kort']
                detail['bakgrund'] = summary['bakgrund']
                detail['beslut'] = summary['beslut']
                out = BETANKANDEN_DIR / f"{dok_id}.json"
                out.write_text(json.dumps(detail, ensure_ascii=False, indent=2), encoding='utf-8')
                print(f"  Fixed {out.name}")
            else:
                print(f"  Still failing, skipping")
        if not args.dry_run:
            build_index(str(DATA_DIR))
        print("\nDone.")
        return

    existing = {p.stem for p in BETANKANDEN_DIR.glob('*.json')}
    print(f"Riksmöte: {rm} | Existing: {len(existing)} | Dry run: {args.dry_run}")

    new_docs = fetch_betankande_ids(rm, existing)
    print(f"Found {len(new_docs)} new betänkanden")

    for doc in new_docs:
        dok_id = doc['dok_id']
        print(f"\nProcessing {dok_id}: {doc['titel'][:60]}")
        if args.dry_run:
            print("  [dry-run] skipping")
            continue
        detail = process_doc(dok_id, doc['titel'], doc['rm'], doc['beteckning'], doc['datum'])
        out = BETANKANDEN_DIR / f"{dok_id}.json"
        out.write_text(json.dumps(detail, ensure_ascii=False, indent=2), encoding='utf-8')
        print(f"  Saved {out.name}")

    if not args.dry_run:
        build_index(str(DATA_DIR))
        print("\nDone.")


if __name__ == '__main__':
    main()
