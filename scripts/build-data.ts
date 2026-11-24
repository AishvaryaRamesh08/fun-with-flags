/**
 * Builds src/data/countries.json — the game's country database — from:
 *   data/raw/countries.json          open dataset snapshot (github.com/mledoze/countries)
 *   data/curated/<region>.json       hand-written tier, hint and fun fact per flag
 *   data/curated/overrides.json      name/capital/currency fixes
 *   data/curated/confusables.json    look-alike flag groups
 * and copies each flag SVG (flag-icons) to public/flags/<code>.svg.
 *
 * Run: npm run data:build
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Continent, Country } from '../src/data/types.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const readJson = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'))

type Raw = {
  cca2: string
  name: { common: string; official: string }
  capital?: string[]
  currencies?: Record<string, { name: string; symbol?: string }>
  region: string
  subregion: string
  unMember: boolean
  altSpellings?: string[]
  latlng: [number, number]
}
type Curated = { tier: 1 | 2 | 3; hint: string; funFact: string }
type Override = {
  name?: string
  aliases?: string[]
  capitals?: string[]
  capitalNote?: string
  currency?: string
  currencies?: Raw['currencies']
}

const raw: Raw[] = readJson('data/raw/countries.json')
const overrides: Record<string, Override> = readJson('data/curated/overrides.json')
const confusableGroups: string[][] = readJson('data/curated/confusables.json').groups
const curated: Record<string, Curated> = Object.assign(
  {},
  ...['africa', 'europe', 'asia', 'americas', 'oceania'].map((r) => readJson(`data/curated/${r}.json`)),
)

// 193 UN members + Vatican City + Palestine = 195 (the dataset flags Vatican as unMember).
const SELECT = (c: Raw) => c.unMember || c.cca2 === 'VA' || c.cca2 === 'PS'

function continentOf(c: Raw): Continent {
  if (c.region === 'Americas') return c.subregion === 'South America' ? 'South America' : 'North America'
  return c.region as Continent
}

const selected = raw.filter(SELECT)
const codes = new Set(selected.map((c) => c.cca2))

const flagSrc = join(root, 'node_modules/flag-icons/flags/4x3')
const flagOut = join(root, 'public/flags')
mkdirSync(flagOut, { recursive: true })

const countries: Country[] = selected
  .map((c): Country => {
    const o = overrides[c.cca2] ?? {}
    const cur = curated[c.cca2]
    if (!cur) throw new Error(`Missing curated hint/fact for ${c.cca2} ${c.name.common}`)

    const currencies = o.currencies ?? c.currencies ?? {}
    const currencyCode = o.currency ?? Object.keys(currencies)[0]
    const currency = currencies[currencyCode]

    const name = o.name ?? c.name.common
    // Hand-picked aliases are always kept (e.g. "USA", "UK"); dataset spellings skip 2–3 letter codes like "JO".
    const aliasSet = new Set(
      [
        ...(o.aliases ?? []),
        ...[c.name.common, c.name.official, ...(c.altSpellings ?? [])].filter((a) => a.length > 3),
      ].filter((a) => a !== name),
    )

    const confusableWith = [
      ...new Set(confusableGroups.filter((g) => g.includes(c.cca2)).flat()),
    ].filter((x) => x !== c.cca2 && codes.has(x))

    const code = c.cca2.toLowerCase()
    copyFileSync(join(flagSrc, `${code}.svg`), join(flagOut, `${code}.svg`))

    return {
      code: c.cca2,
      name,
      officialName: c.name.official,
      aliases: [...aliasSet],
      capitals: o.capitals ?? c.capital ?? [],
      ...(o.capitalNote ? { capitalNote: o.capitalNote } : {}),
      currency: { code: currencyCode, name: currency?.name ?? '', symbol: currency?.symbol ?? '' },
      continent: continentOf(c),
      subregion: c.subregion,
      latlng: c.latlng,
      flag: `flags/${code}.svg`,
      tier: cur.tier,
      hint: cur.hint,
      funFact: cur.funFact,
      confusableWith,
    }
  })
  .sort((a, b) => a.name.localeCompare(b.name))

// Warn about curated entries that don't match a selected country (typos, territories).
for (const k of Object.keys(curated)) if (!codes.has(k)) console.warn(`⚠ curated entry ${k} is not in the country list`)

mkdirSync(join(root, 'src/data'), { recursive: true })
writeFileSync(join(root, 'src/data/countries.json'), JSON.stringify(countries, null, 2) + '\n')

const byContinent = countries.reduce<Record<string, number>>((m, c) => ((m[c.continent] = (m[c.continent] ?? 0) + 1), m), {})
const byTier = countries.reduce<Record<string, number>>((m, c) => ((m[c.tier] = (m[c.tier] ?? 0) + 1), m), {})
console.log(`✔ ${countries.length} countries written to src/data/countries.json`)
console.log('  by continent:', byContinent)
console.log('  by tier:', byTier)
