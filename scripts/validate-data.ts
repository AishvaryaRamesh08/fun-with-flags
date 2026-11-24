/**
 * Checks src/data/countries.json is complete. Fails (exit 1) on any problem.
 * Runs in CI before every deploy. Run locally: npm run data:validate
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CONTINENTS, type Country } from '../src/data/types.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const countries: Country[] = JSON.parse(readFileSync(join(root, 'src/data/countries.json'), 'utf8'))
const errors: string[] = []
const err = (c: Country, msg: string) => errors.push(`${c.code} ${c.name}: ${msg}`)

if (countries.length !== 195) errors.push(`Expected 195 countries, found ${countries.length}`)

const seenCodes = new Set<string>()
const seenNames = new Set<string>()
for (const c of countries) {
  if (seenCodes.has(c.code)) err(c, 'duplicate code')
  if (seenNames.has(c.name.toLowerCase())) err(c, 'duplicate name')
  seenCodes.add(c.code)
  seenNames.add(c.name.toLowerCase())

  if (!c.name) err(c, 'missing name')
  if (!c.capitals.length || c.capitals.some((x) => !x)) err(c, 'missing capital')
  if (!c.currency.code || !c.currency.name) err(c, 'missing currency')
  if (!CONTINENTS.includes(c.continent)) err(c, `bad continent "${c.continent}"`)
  if (![1, 2, 3].includes(c.tier)) err(c, `bad tier ${c.tier}`)
  if (!c.hint || c.hint.length < 15) err(c, 'missing or too-short hint')
  if (!c.funFact || c.funFact.length < 15) err(c, 'missing or too-short fun fact')
  if (!existsSync(join(root, 'public', c.flag))) err(c, `flag file not found: public/${c.flag}`)
}

// Each continent needs at least 4 countries per difficulty pool so every quiz can offer 4 options.
for (const cont of CONTINENTS) {
  const n = countries.filter((c) => c.continent === cont).length
  if (n < 4) errors.push(`${cont} has only ${n} countries`)
}

if (errors.length) {
  console.error(`✖ ${errors.length} data problem(s):\n  ` + errors.join('\n  '))
  process.exit(1)
}
console.log(`✔ ${countries.length} countries valid — every one has a flag, capital, currency, hint and fun fact.`)
