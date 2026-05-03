export const PARTY_COLORS: Record<string, string> = {
  S: '#E8112D', M: '#52BDEC', SD: '#DDDD00', C: '#009933',
  V: '#DA291C', KD: '#000077', L: '#006AB3', MP: '#83CF39', '-': '#9CA3AF',
}

export const PARTY_TEXT_COLORS: Record<string, string> = {
  SD: '#000000',
}

function getTextColor(party: string): string {
  return PARTY_TEXT_COLORS[party] ?? '#FFFFFF'
}

interface Props {
  party: string
  size?: 'sm' | 'md'
}

export function PartyBadge({ party, size = 'sm' }: Props) {
  const bg = PARTY_COLORS[party] ?? '#9CA3AF'
  const color = getTextColor(party)
  const cls = size === 'sm'
    ? 'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold'
    : 'inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold'
  return (
    <span className={cls} style={{ backgroundColor: bg, color }}>
      {party}
    </span>
  )
}
