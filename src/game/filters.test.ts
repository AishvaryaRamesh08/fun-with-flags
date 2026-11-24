import { describe, expect, it } from 'vitest'
import { CONTINENTS, type Continent } from '../data/types'
import { ALL_COUNTRIES, buildBlitz, buildQuiz, questionPool } from './engine'
import { seeded } from './random'
import type { Difficulty, Mode } from './types'

// Every combination of continents (64, including "all"), every difficulty and every quiz mode
const subsets: Continent[][] = Array.from({ length: 1 << CONTINENTS.length }, (_, m) =>
  CONTINENTS.filter((_, i) => m & (1 << i)),
)
const difficulties: Difficulty[] = ['easy', 'medium', 'hard']
const modes: Mode[] = ['flag-to-name', 'name-to-flag', 'capital', 'type-it']

describe('filters: every continent combo × difficulty × mode', () => {
  it('pools only contain the chosen continents and are never too small', () => {
    for (const continents of subsets) {
      for (const difficulty of difficulties) {
        const pool = questionPool({ continents, difficulty })
        expect(pool.length).toBeGreaterThanOrEqual(4)
        if (continents.length) expect(pool.every((c) => continents.includes(c.continent))).toBe(true)
      }
    }
  })

  it('harder levels always include everything from easier levels', () => {
    for (const continents of subsets) {
      const [e, m, h] = difficulties.map((difficulty) => new Set(questionPool({ continents, difficulty }).map((c) => c.code)))
      expect([...e].every((c) => m.has(c))).toBe(true)
      expect([...m].every((c) => h.has(c))).toBe(true)
    }
  })

  it('Hard with all continents covers all 195 countries; each continent on Hard covers that whole continent', () => {
    expect(questionPool({ continents: [], difficulty: 'hard' })).toHaveLength(195)
    for (const c of CONTINENTS) {
      expect(questionPool({ continents: [c], difficulty: 'hard' })).toHaveLength(ALL_COUNTRIES.filter((x) => x.continent === c).length)
    }
  })

  it('every quiz has valid, unique questions and 4 distinct options', () => {
    const rng = seeded(7)
    for (const continents of subsets) {
      for (const difficulty of difficulties) {
        for (const mode of modes) {
          for (const count of [10, 0]) {
            const quiz = buildQuiz({ mode, continents, difficulty, count }, rng)
            const pool = questionPool({ continents, difficulty })
            expect(quiz.length).toBe(count ? Math.min(count, pool.length) : pool.length)
            expect(new Set(quiz.map((q) => q.country.code)).size).toBe(quiz.length)
            for (const q of quiz) {
              if (mode === 'type-it') continue
              expect(q.options).toHaveLength(4)
              expect(q.options).toContain(q.country)
              const labels = q.options.map((o) => (mode === 'capital' ? o.capitals[0] : o.code))
              expect(new Set(labels).size).toBe(4)
            }
          }
        }
      }
    }
  })

  it('Blitz never repeats a country in a game, for every filter, and then ends', () => {
    const rng = seeded(11)
    for (const continents of subsets) {
      for (const difficulty of difficulties) {
        const codes = buildBlitz({ continents, difficulty }, rng).map((q) => q.country.code)
        expect(new Set(codes).size).toBe(codes.length)
        expect(codes.length).toBe(questionPool({ continents, difficulty }).length)
      }
    }
  })

  it('Guess the Country, Find the Flag, Capitals and Type It never repeat a country, even with "All" questions', () => {
    const rng = seeded(12)
    for (const continents of subsets) {
      for (const mode of modes) {
        const quiz = buildQuiz({ mode, continents, difficulty: 'hard', count: 0 }, rng)
        const codes = quiz.map((q) => q.country.code)
        expect(new Set(codes).size).toBe(codes.length)
      }
    }
  })
})
