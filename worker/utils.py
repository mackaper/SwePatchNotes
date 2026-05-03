import re

ANDRAD_PATTERNS = [
    r'\bändring(ar)?\b', r'\bändrad\b', r'\bändringar i\b',
    r'\bändring av\b', r'\bförändr', r'\brevidering\b',
]
UPPAHAVD_PATTERNS = [
    r'\bupphävande\b', r'\bupphäver\b', r'\bupphävs\b',
    r'\bupphävd\b', r'\bavskaffande\b',
]

def infer_status(title: str) -> str:
    t = title.lower()
    if any(re.search(p, t) for p in UPPAHAVD_PATTERNS):
        return 'UPPHÄVD'
    if any(re.search(p, t) for p in ANDRAD_PATTERNS):
        return 'ÄNDRAD'
    return 'NY'

TAG_KEYWORDS = [
    ('MILJÖ', ['miljö', 'klimat', 'utsläpp', 'natur', 'hållbar', 'energi', 'koldioxid', 'biologisk', 'ekolog']),
    ('EKONOMI', ['ekonomi', 'budget', 'skatt', 'finansiell', 'finans', 'statsbudget', 'moms', 'avgift', 'kostnad', 'inkomst', 'bidrag', 'pengar']),
    ('HÄLSA', ['hälsa', 'vård', 'sjukvård', 'läkemedel', 'patient', 'sjukhus', 'psykisk', 'folkhälsa', 'rehabilitering', 'funktionshinder']),
    ('BROTT', ['brott', 'brottsling', 'straff', 'polis', 'rättegång', 'kriminal', 'fängelse', 'rättsväsende', 'påföljd', 'gängkriminalitet', 'åklagare']),
    ('UTBILDNING', ['utbildning', 'skola', 'elev', 'lärare', 'universitet', 'högskola', 'forskning', 'studier', 'läroplan', 'studerande']),
    ('ARBETE', ['arbete', 'arbetstid', 'arbetsmarknad', 'sysselsättning', 'anställning', 'lön', 'fackförening', 'arbetslöshet', 'a-kassa', 'arbetsgivare']),
    ('FÖRSVAR', ['försvar', 'militär', 'väpnade', 'nato', 'säkerhet', 'krig', 'armed', 'försvarsförmåga', 'totalförsvar']),
    ('BOSTAD', ['bostad', 'bostadsmarknad', 'hyresrätt', 'bostadsrättslag', 'fastighet', 'hyra', 'byggande', 'bostadsbrist']),
    ('TRANSPORT', ['transport', 'infrastruktur', 'väg', 'järnväg', 'kollektivtrafik', 'flyg', 'fordon', 'trafikverket', 'bil', 'cykel']),
    ('MIGRATION', ['migration', 'invandring', 'asyl', 'uppehållstillstånd', 'flyktingar', 'utlänning', 'medborgarskap', 'integration']),
    ('BARN', ['barn', 'barnfamilj', 'barnomsorg', 'förskola', 'barnbidrag', 'ungdomar', 'unga', 'föräldrar', 'barnrätt']),
    ('ÄLDRE', ['äldre', 'pensionärer', 'äldreomsorg', 'pension', 'pensionsåldern', 'hemtjänst', 'åldrande']),
    ('DIGITALT', ['digital', 'it ', 'internet', 'cybersäkerhet', 'dataskydd', 'artificiell', 'ai ', 'teknik', 'bredbandsnät']),
    ('JORDBRUK', ['jordbruk', 'lantbruk', 'lantbrukare', 'livsmedel', 'skog', 'fiske', 'djur', 'gris', 'ko', 'mjölk', 'grödor']),
]

def get_tags(titel: str, kort: str) -> list[str]:
    text = (titel + ' ' + kort).lower()
    matched = []
    for tag, keywords in TAG_KEYWORDS:
        if any(kw in text for kw in keywords):
            matched.append(tag)
            if len(matched) >= 2:
                break
    return matched

def parse_beteckning(beteckning: str) -> tuple[str, int]:
    m = re.match(r'([A-Za-zÄÖÅäöå]+)(\d+)', beteckning)
    if m:
        return m.group(1), int(m.group(2))
    return beteckning, 0

VOTE_MAP = {'Yes': 'ja', 'No': 'nej', 'Abstain': 'avstar', 'Absent': 'franvarande'}
VALID_PARTIES = {'S', 'M', 'SD', 'C', 'V', 'KD', 'L', 'MP', '-'}

def aggregate_votes(vote_list: list[dict]) -> dict:
    roster: dict = {}
    for v in vote_list:
        party = v.get('party', '-').upper()
        if party not in VALID_PARTIES:
            party = '-'
        if party not in roster:
            roster[party] = {'ja': 0, 'nej': 0, 'avstar': 0, 'franvarande': 0}
        key = VOTE_MAP.get(v.get('vote', ''), 'avstar')
        roster[party][key] += 1
    return roster
