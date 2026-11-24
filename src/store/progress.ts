import { useSyncExternalStore } from 'react'
import type { Difficulty, GameSettings, Mode } from '../game/types'

/**
 * Everything the game remembers, saved in this browser's localStorage.
 * No accounts, nothing leaves the device.
 */
export interface CountryProgress {
  seen: number
  correct: number
  /** Leitner box 0–5: wrong answer → 0, right answer → +1. Box < 2 after a mistake = needs review */
  box: number
  mistakes: number
}

export type ThemeName = 'clay' | 'amber' | 'phosphor' | 'paper'

export interface Progress {
  version: 1
  countries: Record<string, CountryProgress>
  /** Best % per mode + difficulty (+ continents if filtered), e.g. "flag-to-name:hard" or "capital:easy:Africa,Asia" */
  bestPercent: Record<string, number>
  /** Best Blitz score per difficulty */
  /** Best Blitz points per difficulty (+ continents if filtered), e.g. "hard" or "easy:Europe" */
  blitzBest: Record<string, number>
  gamesPlayed: number
  dayStreak: { count: number; lastDay: string }
  lastSettings: GameSettings | null
  settings: { sound: boolean; vibration: boolean }
  theme: ThemeName
}

const KEY = 'fun-with-flags:v1'

const fresh = (): Progress => ({
  version: 1,
  countries: {},
  bestPercent: {},
  blitzBest: {},
  gamesPlayed: 0,
  dayStreak: { count: 0, lastDay: '' },
  lastSettings: null,
  settings: { sound: true, vibration: true },
  theme: 'paper',
})

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...fresh(), ...JSON.parse(raw) }
  } catch {
    /* private mode or corrupt data: start fresh */
  }
  return fresh()
}

let state: Progress = typeof localStorage === 'undefined' ? fresh() : load()
const listeners = new Set<() => void>()

function update(fn: (p: Progress) => Progress) {
  state = fn(state)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked — keep playing in memory */
  }
  listeners.forEach((l) => l())
}

export const getProgress = () => state
export function useProgress(): Progress {
  return useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => state,
  )
}

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in local time

export function recordAnswer(code: string, correct: boolean) {
  update((p) => {
    const prev = p.countries[code] ?? { seen: 0, correct: 0, box: 0, mistakes: 0 }
    const next: CountryProgress = {
      seen: prev.seen + 1,
      correct: prev.correct + (correct ? 1 : 0),
      box: correct ? Math.min(prev.box + 1, 5) : 0,
      mistakes: prev.mistakes + (correct ? 0 : 1),
    }
    return { ...p, countries: { ...p.countries, [code]: next } }
  })
}

export function recordGame(settings: GameSettings, score: number, total: number) {
  update((p) => {
    const day = today()
    const yesterday = new Date(Date.now() - 864e5).toLocaleDateString('en-CA')
    const dayStreak =
      p.dayStreak.lastDay === day
        ? p.dayStreak
        : { count: p.dayStreak.lastDay === yesterday ? p.dayStreak.count + 1 : 1, lastDay: day }
    const next: Progress = { ...p, gamesPlayed: p.gamesPlayed + 1, dayStreak, lastSettings: settings }
    if (settings.mode === 'blitz') {
      const key = blitzKey(settings.difficulty, settings.continents)
      next.blitzBest = { ...p.blitzBest, [key]: Math.max(p.blitzBest[key] ?? 0, score) }
    } else if (total > 0) {
      const key = bestKey(settings.mode, settings.difficulty, settings.continents)
      next.bestPercent = { ...p.bestPercent, [key]: Math.max(p.bestPercent[key] ?? 0, Math.round((score / total) * 100)) }
    }
    return next
  })
}

/** Best scores are kept per filter, so an easy one-continent round doesn't count as your best for the whole world */
const filterSuffix = (continents: readonly string[] = []) => (continents.length ? `:${[...continents].sort().join(',')}` : '')
export const bestKey = (mode: Mode, difficulty: Difficulty, continents?: readonly string[]) => `${mode}:${difficulty}${filterSuffix(continents)}`
export const blitzKey = (difficulty: Difficulty, continents?: readonly string[]) => `${difficulty}${filterSuffix(continents)}`

/** Countries the player got wrong and hasn't yet answered right twice in a row since */
export function reviewCodes(p: Progress = state): string[] {
  return Object.entries(p.countries)
    .filter(([, c]) => c.mistakes > 0 && c.box < 2)
    .map(([code]) => code)
}

/** Answered right 3+ times in a row */
export const isMastered = (c?: CountryProgress) => !!c && c.box >= 3

export function setSetting(key: keyof Progress['settings'], value: boolean) {
  update((p) => ({ ...p, settings: { ...p.settings, [key]: value } }))
}

export function setTheme(theme: ThemeName) {
  update((p) => ({ ...p, theme }))
}

export function resetProgress() {
  update((p) => ({ ...fresh(), settings: p.settings, theme: p.theme }))
}
