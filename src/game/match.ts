import countriesJson from '../data/countries.json'
import type { Country } from '../data/types'

/** Every normalized country name/alias → its country code, so a real country name is never treated as a typo */
const NAME_TO_CODE = new Map<string, string>()
for (const c of countriesJson as Country[]) {
  for (const n of [c.name, ...c.aliases]) NAME_TO_CODE.set(normalize(n), c.code)
}

/** Lowercase, remove accents/punctuation and filler words so "the Côte d'Ivoire" ≈ "cote divoire". */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\b(the|of|republic|saint|st)\b/g, ' ')
    .replace(/[^a-z0-9]/g, '')
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

/** How many typos we forgive, based on answer length. */
const allowedTypos = (len: number) => (len <= 4 ? 0 : len <= 8 ? 1 : 2)

export type MatchResult = 'exact' | 'close' | 'wrong'

/**
 * Checks a typed answer against a country's name and aliases.
 * 'close' means correct with a small typo — counted right, but we show the proper spelling.
 */
export function matchCountry(input: string, country: Country): MatchResult {
  const guess = normalize(input)
  if (!guess) return 'wrong'
  const targets = [country.name, ...country.aliases].map(normalize).filter(Boolean)
  if (targets.includes(guess)) return 'exact'
  // "Austria" is a real country, not a typo of "Australia"
  const other = NAME_TO_CODE.get(guess)
  if (other && other !== country.code) return 'wrong'
  for (const t of targets) {
    if (levenshtein(guess, t) <= allowedTypos(t.length)) return 'close'
  }
  return 'wrong'
}
