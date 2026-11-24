import countriesJson from '../data/countries.json'
import type { Country } from '../data/types'

const COUNTRIES = countriesJson as Country[]

/** Lowercase, remove accents/punctuation and filler words so "the Côte d'Ivoire" ≈ "cote divoire". */
export function normalize(s: string): string {
  return words(s).join('')
}

/** Filler words ignored everywhere ("Republic of the Congo" ≈ "Congo") */
const FILLER = new Set(['the', 'of', 'and', 'republic', 'saint', 'st'])
/** Words too generic to identify a country on their own ("Islands", "South", "United"…) */
const GENERIC = new Set([
  'city', 'island', 'islands', 'kingdom', 'state', 'states', 'united', 'federal', 'federation', 'democratic',
  'people', 'peoples', 'union', 'commonwealth', 'independent', 'plurinational', 'islamic', 'socialist',
  'principality', 'grand', 'duchy', 'sultanate', 'north', 'south', 'east', 'west', 'new', 'great',
])

function words(s: string): string[] {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w && !FILLER.has(w))
}

/** Edit distance where swapping two neighbouring letters ("Bosnai") counts as one typo */
export function typoDistance(a: string, b: string): number {
  if (a === b) return 0
  const d: number[][] = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
    }
  }
  return d[a.length][b.length]
}

/** How many typos we forgive, based on length. */
const allowedTypos = (len: number) => (len <= 4 ? 0 : len <= 8 ? 1 : 2)

/** Each country's names (common name + aliases) as word lists, prepared once */
const NAME_WORDS = new Map<string, string[][]>(
  COUNTRIES.map((c) => [c.code, [c.name, ...c.aliases].map(words).filter((w) => w.length)]),
)

/** Every normalized full name/alias → its country code, so a real country name is never treated as a typo */
const NAME_TO_CODE = new Map<string, string>()
for (const c of COUNTRIES) for (const w of NAME_WORDS.get(c.code)!) NAME_TO_CODE.set(w.join(''), c.code)

/**
 * Does a typed fragment match part of this country's name?
 * - Multi-word names: one or more whole words in a row, e.g. "Bosnia", "Herzegovina", "Saint Vincent".
 * - Long one-word names (10+ letters): at least half of it from the start, e.g. "Afghan", "Kyrgyz".
 * Returns the typo distance of the best match, or null.
 */
function fragmentDistance(guess: string, code: string): number | null {
  let best: number | null = null
  const consider = (d: number, len: number) => {
    if (d <= allowedTypos(len) && (best === null || d < best)) best = d
  }
  for (const w of NAME_WORDS.get(code)!) {
    if (w.length >= 2) {
      for (let i = 0; i < w.length; i++) {
        for (let j = i; j < w.length; j++) {
          if (i === 0 && j === w.length - 1) continue // the whole name is handled elsewhere
          const run = w.slice(i, j + 1)
          if (run.every((x) => GENERIC.has(x))) continue
          const r = run.join('')
          if (r.length < 4) continue
          consider(typoDistance(guess, r), r.length)
        }
      }
    } else if (w[0].length >= 10 && guess.length >= 5 && guess.length * 2 >= w[0].length && guess.length < w[0].length) {
      consider(typoDistance(guess, w[0].slice(0, guess.length)), guess.length)
    }
  }
  return best
}

/**
 * 'exact'  — the full name (or an accepted alias) typed correctly
 * 'part'   — a correctly typed part of the name that only fits this country ("Bosnia")
 * 'close'  — correct, but with a small typo or a shortened name ("Bosnai", "Afghan")
 * 'wrong'  — anything else, including a different real country ("Austria" for Australia)
 * A part of a name only counts if it identifies exactly one country ("South" or "Islands" never do).
 */
export type MatchResult = 'exact' | 'part' | 'close' | 'wrong'

export function matchCountry(input: string, country: Country): MatchResult {
  const guessWords = words(input)
  const guess = guessWords.join('')
  if (!guess) return 'wrong'
  const targets = NAME_WORDS.get(country.code)!.map((w) => w.join(''))
  if (targets.includes(guess)) return 'exact'
  // "Austria" is a real country, not a typo of "Australia"
  const other = NAME_TO_CODE.get(guess)
  if (other && other !== country.code) return 'wrong'
  for (const t of targets) {
    if (typoDistance(guess, t) <= allowedTypos(t.length)) return 'close'
  }
  // Part of the name: only if it fits this country and no other
  if (guessWords.every((w) => GENERIC.has(w))) return 'wrong'
  const mine = fragmentDistance(guess, country.code)
  if (mine === null) return 'wrong'
  const fitsAnother = COUNTRIES.some((c) => c.code !== country.code && fragmentDistance(guess, c.code) !== null)
  if (fitsAnother) return 'wrong'
  return mine === 0 ? 'part' : 'close'
}

/** All other countries' full names/aliases, normalized, for the "still typing?" check */
const ALL_NAMES = [...NAME_TO_CODE.entries()]

/**
 * True if what's typed so far could still be the start of a different country's name,
 * e.g. "Niger" on its way to "Nigeria", or "Mauri" on its way to "Mauritius".
 * Type It waits for Enter in that case instead of accepting mid-word.
 */
export function couldBeAnotherCountry(input: string, country: Country): boolean {
  const guess = normalize(input)
  if (!guess) return false
  return ALL_NAMES.some(([name, code]) => code !== country.code && name.length > guess.length && name.startsWith(guess))
}
