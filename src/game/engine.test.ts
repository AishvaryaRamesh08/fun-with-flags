import { describe, expect, it } from 'vitest'
import { ALL_COUNTRIES, BlitzDeck, blitzPoints, buildQuiz, countryByCode, distractors, questionPool } from './engine'
import { matchCountry } from './match'
import { seeded } from './random'
import type { Difficulty } from './types'

const c = (code: string) => countryByCode(code)!

describe('questionPool', () => {
  it('easy uses only well-known countries', () => {
    expect(questionPool({ continents: [], difficulty: 'easy' }).every((x) => x.tier === 1)).toBe(true)
  })
  it('hard uses all 195', () => {
    expect(questionPool({ continents: [], difficulty: 'hard' })).toHaveLength(195)
  })
  it('filters by continent', () => {
    const pool = questionPool({ continents: ['Europe', 'Oceania'], difficulty: 'hard' })
    expect(pool.every((x) => x.continent === 'Europe' || x.continent === 'Oceania')).toBe(true)
  })
  it('widens only tiny pools, so difficulty levels stay different', () => {
    // Oceania has only 2 tier-1 countries, so Easy widens to tier 2 (4 countries) but not further
    expect(questionPool({ continents: ['Oceania'], difficulty: 'easy' })).toHaveLength(4)
    expect(questionPool({ continents: ['Oceania'], difficulty: 'hard' })).toHaveLength(14)
  })
})

describe('distractors', () => {
  const levels: Difficulty[] = ['easy', 'medium', 'hard']
  it.each(levels)('%s gives 3 distinct wrong answers for every country', (difficulty) => {
    const rng = seeded(1)
    for (const country of ALL_COUNTRIES) {
      const d = distractors(country, difficulty, rng)
      expect(d).toHaveLength(3)
      expect(new Set(d.map((x) => x.code)).size).toBe(3)
      expect(d.map((x) => x.code)).not.toContain(country.code)
    }
  })
  it('hard mode uses look-alike flags first', () => {
    const d = distractors(c('TD'), 'hard', seeded(2)).map((x) => x.code)
    expect(d.sort()).toEqual(['AD', 'MD', 'RO'])
  })
  it('medium mode stays on the same continent', () => {
    expect(distractors(c('JO'), 'medium', seeded(3)).every((x) => x.continent === 'Asia')).toBe(true)
  })
})

describe('buildQuiz', () => {
  it('respects the question count and never repeats a country', () => {
    const q = buildQuiz({ mode: 'flag-to-name', continents: [], difficulty: 'hard', count: 20 }, seeded(4))
    expect(q).toHaveLength(20)
    expect(new Set(q.map((x) => x.country.code)).size).toBe(20)
    for (const question of q) {
      expect(question.options).toHaveLength(4)
      expect(question.options).toContain(question.country)
    }
  })
  it('count 0 means every country in the pool', () => {
    const q = buildQuiz({ mode: 'type-it', continents: ['South America'], difficulty: 'hard', count: 0 })
    expect(q).toHaveLength(12)
    expect(q[0].options).toHaveLength(0)
  })
})

describe('BlitzDeck', () => {
  it('goes through the whole pool before repeating', () => {
    const deck = new BlitzDeck({ continents: ['South America'], difficulty: 'hard' }, seeded(5))
    const seen = Array.from({ length: 12 }, () => deck.next().country.code)
    expect(new Set(seen).size).toBe(12)
  })
  it('rewards streaks', () => {
    expect(blitzPoints(0)).toBe(10)
    expect(blitzPoints(3)).toBe(15)
    expect(blitzPoints(100)).toBe(30)
  })
})

describe('matchCountry', () => {
  it('accepts exact names, aliases, accents and case', () => {
    expect(matchCountry('jordan', c('JO'))).toBe('exact')
    expect(matchCountry('Turkey', c('TR'))).toBe('exact')
    expect(matchCountry('turkiye', c('TR'))).toBe('exact')
    expect(matchCountry('cote divoire', c('CI'))).toBe('exact')
    expect(matchCountry('USA', c('US'))).toBe('exact')
    expect(matchCountry('Bosnia & Herzegovina', c('BA'))).toBe('exact')
  })
  it('forgives small typos on longer names', () => {
    expect(matchCountry('Argentinna', c('AR'))).toBe('close')
    expect(matchCountry('Phillipines', c('PH'))).toBe('close')
  })
  it('rejects wrong answers and big typos', () => {
    expect(matchCountry('Iran', c('IQ'))).toBe('wrong')
    expect(matchCountry('Austria', c('AU'))).toBe('wrong')
    expect(matchCountry('', c('JO'))).toBe('wrong')
  })
  it('does not confuse Niger and Nigeria', () => {
    expect(matchCountry('Niger', c('NG'))).toBe('wrong')
    expect(matchCountry('Nigeria', c('NE'))).toBe('wrong')
  })
})
