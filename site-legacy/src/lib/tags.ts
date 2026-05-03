const TAG_KEYWORDS: [string, string[]][] = [
  ['MILJÖ', ['miljö', 'klimat', 'utsläpp', 'natur', 'hållbar', 'energi', 'koldioxid', 'biologisk', 'ekolog']],
  ['EKONOMI', ['ekonomi', 'budget', 'skatt', 'finansiell', 'finans', 'statsbudget', 'moms', 'avgift', 'kostnad', 'inkomst', 'bidrag', 'pengar']],
  ['HÄLSA', ['hälsa', 'vård', 'sjukvård', 'läkemedel', 'patient', 'sjukhus', 'psykisk', 'folkhälsa', 'rehabilitering', 'funktionshinder']],
  ['BROTT', ['brott', 'brottsling', 'straff', 'polis', 'rättegång', 'kriminal', 'fängelse', 'rättsväsende', 'påföljd', 'gängkriminalitet', 'åklagare']],
  ['UTBILDNING', ['utbildning', 'skola', 'elev', 'lärare', 'universitet', 'högskola', 'forskning', 'studier', 'läroplan', 'studerande']],
  ['ARBETE', ['arbete', 'arbetstid', 'arbetsmarknad', 'sysselsättning', 'anställning', 'lön', 'fackförening', 'arbetslöshet', 'a-kassa', 'arbetsgivare']],
  ['FÖRSVAR', ['försvar', 'militär', 'väpnade', 'nato', 'säkerhet', 'krig', 'armed', 'försvarsförmåga', 'totalförsvar']],
  ['BOSTAD', ['bostad', 'bostadsmarknad', 'hyresrätt', 'bostadsrättslag', 'fastighet', 'hyra', 'byggande', 'bostadsbrist']],
  ['TRANSPORT', ['transport', 'infrastruktur', 'väg', 'järnväg', 'kollektivtrafik', 'flyg', 'fordon', 'trafikverket', 'bil', 'cykel']],
  ['MIGRATION', ['migration', 'invandring', 'asyl', 'uppehållstillstånd', 'flyktingar', 'utlänning', 'medborgarskap', 'integration']],
  ['BARN', ['barn', 'barnfamilj', 'barnomsorg', 'förskola', 'barnbidrag', 'ungdomar', 'unga', 'föräldrar', 'barnrätt']],
  ['ÄLDRE', ['äldre', 'pensionärer', 'äldreomsorg', 'pension', 'pensionsåldern', 'hemtjänst', 'åldrande']],
  ['DIGITALT', ['digital', 'it ', 'internet', 'cybersäkerhet', 'dataskydd', 'artificiell', 'ai ', 'teknik', 'bredbandsnät']],
  ['JORDBRUK', ['jordbruk', 'lantbruk', 'lantbrukare', 'livsmedel', 'skog', 'fiske', 'djur', 'gris', 'ko', 'mjölk', 'grödor']],
];

export function getTagsForDecision(title: string, summary: string): string[] {
  const text = (title + ' ' + summary).toLowerCase();
  const matched: string[] = [];
  for (const [tag, keywords] of TAG_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) {
      matched.push(tag);
      if (matched.length >= 2) break;
    }
  }
  return matched;
}
