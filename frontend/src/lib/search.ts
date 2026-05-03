import Fuse from 'fuse.js'
import type { BetankandeIndex } from '../types'

let fuse: Fuse<BetankandeIndex> | null = null

export function initSearch(items: BetankandeIndex[]) {
  fuse = new Fuse(items, {
    keys: ['titel', 'kort_sammanfattning', 'tags', 'utskott'],
    threshold: 0.35,
    includeScore: true,
  })
}

export function search(query: string, items: BetankandeIndex[]): BetankandeIndex[] {
  if (!query.trim()) return items
  if (!fuse) initSearch(items)
  return fuse!.search(query).map(r => r.item)
}
