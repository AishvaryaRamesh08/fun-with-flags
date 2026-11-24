import type { IconName } from '../components/Icon'
import type { Continent, Country } from '../data/types'

export type Mode = 'flag-to-name' | 'name-to-flag' | 'type-it' | 'capital' | 'blitz'
export type Difficulty = 'easy' | 'medium' | 'hard'
/** Concrete question kind (Blitz mixes the MCQ kinds) */
export type QuestionKind = 'flag-to-name' | 'name-to-flag' | 'type-it' | 'capital'

export interface GameSettings {
  mode: Mode
  /** Empty = all continents */
  continents: Continent[]
  difficulty: Difficulty
  /** Number of questions; 0 = all available. Ignored in Blitz. */
  count: number
}

export interface Question {
  kind: QuestionKind
  country: Country
  /** 4 shuffled options including the answer (empty for type-it) */
  options: Country[]
}

export const BLITZ_SECONDS = 60

export const MODE_INFO: Record<Mode, { title: string; icon: IconName; blurb: string }> = {
  'flag-to-name': { title: 'Guess the Country', icon: 'flag', blurb: 'See a flag, pick the country' },
  'name-to-flag': { title: 'Find the Flag', icon: 'search', blurb: 'See a country, pick its flag' },
  'type-it': { title: 'Type It', icon: 'keyboard', blurb: 'Name every flag on one page' },
  capital: { title: 'Capitals', icon: 'capital', blurb: 'Pick the capital city' },
  blitz: { title: '60s Blitz', icon: 'zap', blurb: 'Mixed questions against the clock' },
}

export const DIFFICULTY_INFO: Record<Difficulty, { label: string; blurb: string }> = {
  easy: { label: 'Easy', blurb: 'Only the best-known countries, easy options' },
  medium: { label: 'Medium', blurb: 'Well-known and lesser-known countries, options from the same continent' },
  hard: { label: 'Hard', blurb: 'Every country, look-alike flags as options' },
}
