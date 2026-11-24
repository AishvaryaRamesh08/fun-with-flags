import { describe, expect, it } from 'vitest'
import { ALL_COUNTRIES, countryByCode } from './engine'
import { couldBeAnotherCountry, matchCountry } from './match'

const c = (code: string) => countryByCode(code)!
const ok = (input: string, code: string) => matchCountry(input, c(code)) !== 'wrong'

describe('typing part of a long or multi-word name', () => {
  it('accepts the first word, or any whole word, of multi-word names', () => {
    expect(matchCountry('Bosnia', c('BA'))).toBe('part')
    expect(matchCountry('Herzegovina', c('BA'))).toBe('part')
    expect(matchCountry('Trinidad', c('TT'))).toBe('part')
    expect(matchCountry('Saint Vincent', c('VC'))).toBe('part')
    expect(matchCountry('St Kitts', c('KN'))).toBe('part')
    expect(matchCountry('Papua', c('PG'))).toBe('part')
    expect(matchCountry('Antigua', c('AG'))).toBe('part')
    expect(matchCountry('Sao Tome', c('ST'))).toBe('part')
    expect(matchCountry('Central African', c('CF'))).toBe('exact') // "Republic" is ignored, so this is the full name
    expect(matchCountry('Marshall', c('MH'))).toBe('part')
    expect(matchCountry('Equatorial', c('GQ'))).toBe('part')
    expect(matchCountry('Burkina', c('BF'))).toBe('part')
  })

  it('forgives typos in those parts, including swapped letters', () => {
    expect(matchCountry('Bosnai', c('BA'))).toBe('close')
    expect(matchCountry('Herzogovina', c('BA'))).toBe('close')
    expect(matchCountry('Trinidat', c('TT'))).toBe('close')
    expect(matchCountry('Grenadine', c('VC'))).toBe('close')
  })

  it('accepts at least half of a long one-word name', () => {
    expect(ok('Afghan', 'AF')).toBe(true)
    expect(ok('Kyrgyz', 'KG')).toBe(true)
    expect(ok('Kazakh', 'KZ')).toBe(true)
    expect(ok('Liechten', 'LI')).toBe(true)
    expect(ok('Switzer', 'CH')).toBe(true)
    expect(ok('Afgan', 'AF')).toBe(true) // short + a typo
  })

  it('never accepts a part that fits more than one country', () => {
    expect(ok('South', 'ZA')).toBe(false) // South Africa / Korea / Sudan
    expect(ok('Saint', 'LC')).toBe(false)
    expect(ok('Islands', 'SB')).toBe(false)
    expect(ok('United', 'US')).toBe(false)
    expect(ok('Africa', 'ZA')).toBe(false) // also fits Central African Republic
    expect(ok('Domin', 'DO')).toBe(false) // Dominica / Dominican Republic
    expect(ok('New', 'NZ')).toBe(false)
  })

  it('never accepts a different real country as part of a name', () => {
    expect(ok('Guinea', 'GW')).toBe(false) // Guinea is its own country
    expect(ok('Guinea', 'PG')).toBe(false)
    expect(ok('Sudan', 'SS')).toBe(false)
    expect(ok('Niger', 'NG')).toBe(false)
    expect(ok('Dominica', 'DO')).toBe(false)
    expect(ok('Congo', 'CD')).toBe(false) // "Congo" is the Republic of the Congo
  })

  it('does not make short names easy: half of a short name is not enough', () => {
    expect(ok('Germ', 'DE')).toBe(false)
    expect(ok('Argen', 'AR')).toBe(false)
    expect(ok('Ind', 'IN')).toBe(false)
  })

  it('every full name is still an exact match', () => {
    for (const country of ALL_COUNTRIES) expect(matchCountry(country.name, country)).toBe('exact')
  })

  it('no single word from any name is accepted for two different countries', () => {
    const words = new Set(ALL_COUNTRIES.flatMap((x) => x.name.split(/[\s-]+/)).filter((w) => w.length >= 4))
    for (const w of words) {
      // only countries whose name shares a letter-start are realistic candidates; checking all keeps it simple
      const accepted = ALL_COUNTRIES.filter((x) => matchCountry(w, x) !== 'wrong').map((x) => x.code)
      expect(accepted.length, `"${w}" accepted for ${accepted.join(', ')}`).toBeLessThanOrEqual(1)
    }
  })

  it('waits (does not accept mid-word) when the letters could still become another country', () => {
    expect(couldBeAnotherCountry('Niger', c('NE'))).toBe(true) // could be Nigeria
    expect(couldBeAnotherCountry('Mauri', c('MR'))).toBe(true) // could be Mauritius
    expect(couldBeAnotherCountry('Dominica', c('DM'))).toBe(true) // could be Dominican Republic
    expect(couldBeAnotherCountry('Bosnia', c('BA'))).toBe(false)
    expect(couldBeAnotherCountry('Afghan', c('AF'))).toBe(false)
    expect(couldBeAnotherCountry('Nigeria', c('NG'))).toBe(false)
    // …but Enter still accepts the right answer
    expect(matchCountry('Niger', c('NE'))).toBe('exact')
  })
})
