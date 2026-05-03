import time
import requests
from utils import VALID_PARTIES

API_BASE = 'https://data.riksdagen.se'

ROST_MAP = {'Ja': 'ja', 'Nej': 'nej', 'Avstår': 'avstar', 'Frånvarande': 'franvarande'}


def fetch_votes(rm: str, beteckning: str) -> dict:
    url = f"{API_BASE}/voteringlista/?rm={rm}&bet={beteckning}&punkt=1&utformat=json&sz=500"
    try:
        resp = requests.get(url, timeout=30)
        if not resp.ok:
            return {}
        text = resp.text.strip()
        if not text:
            return {}
        data = resp.json()
    except Exception as e:
        print(f"  Vote fetch error for {rm}/{beteckning}: {e}")
        return {}

    votering = data.get('voteringlista', {}).get('votering')
    if not votering:
        return {}
    if not isinstance(votering, list):
        votering = [votering]

    roster: dict = {}
    for v in votering:
        party = v.get('parti', '-').upper()
        if party not in VALID_PARTIES:
            party = '-'
        if party not in roster:
            roster[party] = {'ja': 0, 'nej': 0, 'avstar': 0, 'franvarande': 0}
        key = ROST_MAP.get(v.get('rost', ''), 'avstar')
        roster[party][key] += 1

    return roster
