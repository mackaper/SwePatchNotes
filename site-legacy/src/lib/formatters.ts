export function formatBetRef(rm?: string, beteckning?: string): string {
  if (!rm || !beteckning) return '';
  return `Bet. ${rm}:${beteckning}`;
}

import type { DecisionStatus } from '../types';

const ANDRAD_PATTERNS = [
  /\bändring(ar)?\b/i,
  /\bändrad\b/i,
  /\bändringar i\b/i,
  /\bändring av\b/i,
  /\bförändr/i,
  /\brevidering\b/i,
];

const UPPAHAVD_PATTERNS = [
  /\bupphävande\b/i,
  /\bupphäver\b/i,
  /\bupphävs\b/i,
  /\bupphävd\b/i,
  /\bavskaffande\b/i,
];

export function inferStatus(title: string): DecisionStatus {
  if (UPPAHAVD_PATTERNS.some((re) => re.test(title))) return 'UPPHÄVD';
  if (ANDRAD_PATTERNS.some((re) => re.test(title))) return 'ÄNDRAD';
  return 'NY';
}
