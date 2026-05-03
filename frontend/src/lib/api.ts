import type { BetankandeIndex, BetankandeDetail } from '../types'

const BASE = '/data'

export async function fetchIndex(): Promise<BetankandeIndex[]> {
  const res = await fetch(`${BASE}/index.json`)
  if (!res.ok) throw new Error('Failed to load index')
  return res.json()
}

export async function fetchDetail(dokId: string): Promise<BetankandeDetail> {
  const res = await fetch(`${BASE}/betankanden/${dokId}.json`)
  if (!res.ok) throw new Error(`Failed to load ${dokId}`)
  return res.json()
}
