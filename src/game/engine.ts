import countriesJson from '../data/countries.json'
import type { Country } from '../data/types'
import { pick, shuffle, type Rng } from './random'
import type { Difficulty, GameSettings, Question, QuestionKind } from './types'

export const ALL_COUNTRIES = countriesJson as Country[]
const BY_CODE = new Map(ALL_COUNTRIES.map((c) => [c.code, c]))
export const countryByCode = (code: string) => BY_CODE.get(code)

const MAX_TIER: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 }
const MIN_POOL = 4

/**
 * Countries the player will be asked about. Filters by continent and difficulty tier.
 * A level only widens to the next tier when it has fewer than 4 countries (e.g. Oceania on
 * Easy has just Australia and New Zealand), so Easy, Medium and Hard stay genuinely different.
 * Wrong answer options always come from all 195 countries, so even a small pool gets 4 options.
 */
export function questionPool(settings: Pick<GameSettings, 'continents' | 'difficulty'>, all = ALL_COUNTRIES): Country[] {
  const inContinent = settings.continents.length
    ? all.filter((c) => settings.continents.includes(c.continent))
    : all
  for (let tier = MAX_TIER[settings.difficulty]; tier <= 3; tier++) {
    const pool = inContinent.filter((c) => c.tier <= tier)
    if (pool.length >= MIN_POOL || tier === 3) return pool
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
  if (settings.mode === 'blitz') throw new Error('Use buildBlitz for blitz mode')
  const pool = shuffle(questionPool(settings), rng)
  const n = settings.count > 0 ? Math.min(settings.count, pool.length) : pool.length
  return pool.slice(0, n).map((c) => makeQuestion(c, settings.mode as QuestionKind, settings.difficulty, rng))
}

const BLITZ_KINDS: QuestionKind[] = ['flag-to-name', 'name-to-flag', 'flag-to-name', 'capital']

/**
 * All the questions for one Blitz game, built up front: every country in the pool exactly once,
 * shuffled, each with a random question type. If you answer them all before 60s, the game ends.
 * (Built as a plain list, not a stateful deck, so nothing can be skipped or drawn twice.)
 */
export function buildBlitz(settings: Pick<GameSettings, 'continents' | 'difficulty'>, rng: Rng = Math.random): Question[] {
  return shuffle(questionPool(settings), rng).map((c) => makeQuestion(c, pick(BLITZ_KINDS, rng), settings.difficulty, rng))
}

/** Blitz scoring: 10 points, +5 for every 3 correct in a row (max +20). */
export function blitzPoints(streak: number): number {
  return 10 + Math.min(Math.floor(streak / 3) * 5, 20)
}
