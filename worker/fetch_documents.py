import time
import requests
from datetime import date

API_BASE = 'https://data.riksdagen.se'


def get_current_rm() -> str:
    today = date.today()
    start = today.year - 1 if today.month < 9 else today.year
    return f"{start}/{(start + 1) % 100:02d}"


def fetch_betankande_ids(rm: str, existing_ids: set) -> list[dict]:
    url = f"{API_BASE}/dokumentlista/?doktyp=rskr&utformat=json&rm={rm}&sz=500"
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"Failed to fetch rskr for {rm}: {e}")
        return []

    docs = data.get('dokumentlista', {}).get('dokument', [])
    if not docs:
        return []
    if not isinstance(docs, list):
        docs = [docs]

    result = []
    for rskr in docs:
        time.sleep(0.3)
        try:
            status_resp = requests.get(f"{API_BASE}/dokumentstatus/{rskr['dok_id']}.json", timeout=30)
            if not status_resp.ok:
                continue
            refs = status_resp.json().get('dokumentstatus', {}).get('dokreferens', {}).get('referens', [])
            if not isinstance(refs, list):
                refs = [refs]
            bet_ref = next((r for r in refs if r.get('ref_dok_typ') == 'bet'), None)
            if not bet_ref:
                continue
            bet_id = bet_ref['ref_dok_id']
            if bet_id in existing_ids:
                continue
            result.append({
                'dok_id': bet_id,
                'rm': bet_ref.get('ref_dok_rm', rm),
                'beteckning': bet_ref.get('ref_dok_bet', ''),
                'titel': bet_ref.get('ref_dok_titel', ''),
                'datum': rskr.get('publicerad', ''),
            })
        except Exception as e:
            print(f"  Error processing rskr {rskr.get('dok_id')}: {e}")

    return result


def get_document_text(dok_id: str) -> str:
    try:
        resp = requests.get(f"{API_BASE}/dokument/{dok_id}.text", timeout=30)
        return resp.text if resp.ok else ''
    except Exception:
        return ''
