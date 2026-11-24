import countriesJson from '../data/countries.json'
import type { Country } from '../data/types'
import { pick, shuffle, type Rng } from './random'
import type { Difficulty, GameSettings, Question, QuestionKind } from './types'

export const ALL_COUNTRIES = countriesJson as Country[]
const BY_CODE = new Map(ALL_COUNTRIES.map((c) => [c.code, c]))
export const countryByCode = (code: string) => BY_CODE.get(code)

const MAX_TIER: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }

/**
 * Countries the player will be asked about. Filters by continent and difficulty tier.
 * If a small continent has too few countries at that tier (e.g. Oceania on Easy),
 * the pool widens to the next tier so there are always enough to play.
 */
export function questionPool(settings: Pick<GameSettings, 'continents' | 'difficulty'>, all = ALL_COUNTRIES): Country[] {
  const inContinent = settings.continents.length
    ? all.filter((c) => settings.continents.includes(c.continent))
    : all
  for (let tier = MAX_TIER[settings.difficulty]; tier <= 3; tier++) {
    const pool = inContinent.filter((c) => c.tier <= tier)
    if (pool.length >= 8 || tier === 3) return pool
  }
  return inContinent
}

/** Three wrong options for `answer`, harder to tell apart as difficulty rises. */
export function distractors(answer: Country, difficulty: Difficulty, rng: Rng = Math.random, all = ALL_COUNTRIES): Country[] {
  const others = all.filter((c) => c.code !== answer.code)
  const chosen: Country[] = []
  const take = (candidates: Country[]) => {
    for (const c of shuffle(candidates, rng)) {
      if (chosen.length >= 3) return
      if (!chosen.includes(c)) chosen.push(c)
    }
  }

  if (difficulty === 'easy') {
    // Well-known countries from other continents: clearly different flags
    take(others.filter((c) => c.continent !== answer.continent && c.tier <= 2))
  } else if (difficulty === 'medium') {
    take(others.filter((c) => c.continent === answer.continent))
  } else {
    take(answer.confusableWith.map((code) => BY_CODE.get(code)!).filter(Boolean))
    take(others.filter((c) => c.subregion === answer.subregion))
    take(others.filter((c) => c.continent === answer.continent))
  }
  take(others) // top up if a group was too small
  return chosen
}

export function makeQuestion(country: Country, kind: QuestionKind, difficulty: Difficulty, rng: Rng = Math.random): Question {
  if (kind === 'type-it') return { kind, country, options: [] }
  let wrong = distractors(country, difficulty, rng)
  if (kind === 'capital') {
    // Avoid two options that share a capital name (never happens today, but be safe)
    wrong = wrong.filter((w) => w.capitals[0] !== country.capitals[0])
  }
  return { kind, country, options: shuffle([country, ...wrong], rng) }
}

/** A fixed-length quiz with no repeated countries. */
export function buildQuiz(settings: GameSettings, rng: Rng = Math.random): Question[] {
  if (settings.mode === 'blitz') throw new Error('Use BlitzDeck for blitz mode')
  const pool = shuffle(questionPool(settings), rng)
  const n = settings.count > 0 ? Math.min(settings.count, pool.length) : pool.length
  return pool.slice(0, n).map((c) => makeQuestion(c, settings.mode as QuestionKind, settings.difficulty, rng))
}

const BLITZ_KINDS: QuestionKind[] = ['flag-to-name', 'name-to-flag', 'flag-to-name', 'capital']

/** Endless shuffled questions for Blitz. Goes through the whole pool before repeating. */
export class BlitzDeck {
  private queue: Country[] = []
  private pool: Country[]
  private settings: Pick<GameSettings, 'continents' | 'difficulty'>
  private rng: Rng
  constructor(settings: Pick<GameSettings, 'continents' | 'difficulty'>, rng: Rng = Math.random) {
    this.settings = settings
    this.rng = rng
    this.pool = questionPool(settings)
  }
  next(): Question {
    if (!this.queue.length) this.queue = shuffle(this.pool, this.rng)
    const country = this.queue.pop()!
    return makeQuestion(country, pick(BLITZ_KINDS, this.rng), this.settings.difficulty, this.rng)
  }
}

/** Blitz scoring: 10 points, +5 for every 3 correct in a row (max +20). */
export function blitzPoints(streak: number): number {
  return 10 + Math.min(Math.floor(streak / 3) * 5, 20)
}
