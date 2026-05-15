import re
import time
import requests
from utils import VALID_PARTIES

API_BASE = 'https://data.riksdagen.se'

ROST_MAP = {'Ja': 'ja', 'Nej': 'nej', 'Avstår': 'avstar', 'Frånvarande': 'franvarande'}


def _aggregate_roster(rows: list) -> tuple[dict, int, int, int, int]:
    roster: dict = {}
    ja = nej = avstar = franvarande = 0
    for v in rows:
        party = v.get('parti', '-').upper()
        if party not in VALID_PARTIES:
            party = '-'
        if party not in roster:
            roster[party] = {'ja': 0, 'nej': 0, 'avstar': 0, 'franvarande': 0}
        key = ROST_MAP.get(v.get('rost', ''), 'avstar')
        roster[party][key] += 1
        if key == 'ja': ja += 1
        elif key == 'nej': nej += 1
        elif key == 'avstar': avstar += 1
        else: franvarande += 1
    return roster, ja, nej, avstar, franvarande


def _fetch_punkt_rows(rm: str, beteckning: str, punkt: str, attempts: int = 3) -> list:
    url = f"{API_BASE}/voteringlista/?rm={rm}&bet={beteckning}&punkt={punkt}&utformat=json&sz=500"
    for i in range(attempts):
        try:
            resp = requests.get(url, timeout=60)
            if not resp.ok:
                return []
            data = resp.json()
            rows = data.get('voteringlista', {}).get('votering', [])
            if not isinstance(rows, list):
                rows = [rows] if rows else []
            return rows
        except Exception as e:
            if i < attempts - 1:
                time.sleep(5)
    return []


def _fetch_punkt_rubriker(dok_id: str) -> dict:
    """Returns {punkt_number: rubrik_string} from utskottsforslag endpoint."""
    try:
        resp = requests.get(f"{API_BASE}/utskottsforslag/{dok_id}", timeout=30)
        if not resp.ok:
            return {}
        xml = resp.text
        rubriker = {}
        for m in re.finditer(r'<punkt>(\d+)</punkt>\s*<rubrik>(.*?)</rubrik>', xml, re.DOTALL):
            punkt = m.group(1)
            rubrik = re.sub(r'<[^>]+>', '', m.group(2)).strip()
            rubriker[punkt] = rubrik
        return rubriker
    except Exception:
        return {}


def fetch_votes(rm: str, beteckning: str) -> dict:
    """Fetch punkt=1 votes and return aggregated roster. Backward compatible."""
    rows = _fetch_punkt_rows(rm, beteckning, '1')
    if not rows:
        return {}
    roster, *_ = _aggregate_roster(rows)
    return roster


def fetch_all_punkter(rm: str, beteckning: str, dok_id: str) -> list:
    """
    Fetch all voting points for a betänkande.
    Returns list of dicts with punkt, rubrik, ja, nej, avstar, franvarande, roster.
    Skips punkt 1 (main vote already stored in roster field).
    """
    rubriker = _fetch_punkt_rubriker(dok_id)
    result = []

    for punkt_nr in range(2, 20):
        punkt = str(punkt_nr)
        time.sleep(2)
        rows = _fetch_punkt_rows(rm, beteckning, punkt)
        if not rows:
            break
        roster, ja, nej, avstar, franvarande = _aggregate_roster(rows)
        rubrik = rubriker.get(punkt, f'Punkt {punkt}')
        result.append({
            'punkt': punkt,
            'rubrik': rubrik,
            'ja': ja,
            'nej': nej,
            'avstar': avstar,
            'franvarande': franvarande,
            'roster': roster,
        })

    return result
