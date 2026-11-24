import { useEffect, useMemo, useRef, useState } from 'react'
import type { Navigate } from '../App'
import { Confetti } from '../components/Confetti'
import { Flag } from '../components/Flag'
import { feedback } from '../components/feedback'
import { Panda, type Mood } from '../components/Panda'
import type { Country } from '../data/types'
import { countryByCode, questionPool } from '../game/engine'
import { matchCountry } from '../game/match'
import { shuffle } from '../game/random'
import type { GameSettings } from '../game/types'
import { bestKey, getProgress, recordAnswer, recordGame } from '../store/progress'

type Order = 'az' | 'random'

/** An unfinished game is kept so a phone reload or a quick app switch doesn't lose your progress */
const SAVE_KEY = 'fun-with-flags:type-grid'
interface Saved {
  key: string
  order: Order
  randomCodes: string[]
  solved: string[]
}
const settingsKey = (s: GameSettings) => `${s.difficulty}|${[...s.continents].sort().join(',')}`

function loadSaved(key: string): Saved | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Saved | null
    return saved?.key === key ? saved : null
  } catch {
    return null
  }
}

/**
 * Type It: every flag in the chosen pool on one page with an answer box under each.
 * No timer. A name is accepted as soon as it's typed exactly; small typos are accepted on Enter.
 */
export function TypeGrid({ settings, navigate }: { settings: GameSettings; navigate: Navigate }) {
  const key = settingsKey(settings)
  const pool = useMemo(() => questionPool(settings), [settings])
  const saved = useMemo(() => loadSaved(key), [key])

  const [order, setOrder] = useState<Order>(saved?.order ?? 'az')
  const [randomCodes] = useState<string[]>(() =>
    saved?.randomCodes.length === pool.length ? saved.randomCodes : shuffle(pool).map((c) => c.code),
  )
  const [solved, setSolved] = useState<Set<string>>(() => new Set(saved?.solved ?? []))
  const [revealed, setRevealed] = useState(false)
  const [hideSolved, setHideSolved] = useState(false)
  const [wrongCode, setWrongCode] = useState<string | null>(null)
  const [mood, setMood] = useState<Mood>('thinking')
  const [reaction, setReaction] = useState(0)
  const [spellNote, setSpellNote] = useState<string | null>(null)
  const inputs = useRef(new Map<string, HTMLInputElement>())

  const list: Country[] = useMemo(
    () =>
      order === 'az'
        ? [...pool].sort((a, b) => a.name.localeCompare(b.name))
        : randomCodes.map((c) => countryByCode(c)!).filter(Boolean),
    [order, pool, randomCodes],
  )
  const visible = hideSolved && !revealed ? list.filter((c) => !solved.has(c.code)) : list
  const total = pool.length
  const done = solved.size === total

  useEffect(() => {
    if (revealed || done) localStorage.removeItem(SAVE_KEY)
    else localStorage.setItem(SAVE_KEY, JSON.stringify({ key, order, randomCodes, solved: [...solved] } satisfies Saved))
  }, [key, order, randomCodes, solved, revealed, done])

  const finish = (gaveUp: boolean) => {
    const missed = list.filter((c) => !solved.has(c.code))
    if (gaveUp) missed.forEach((c) => recordAnswer(c.code, false))
    const prevBest = getProgress().bestPercent[bestKey('type-it', settings.difficulty)] ?? 0
    const pct = Math.round((solved.size / total) * 100)
    recordGame(settings, solved.size, total)
    feedback.finish()
    navigate({
      name: 'results',
      result: {
        settings,
        score: solved.size,
        correct: solved.size,
        answered: total,
        total,
        bestStreak: solved.size,
        missed,
        newBest: pct > prevBest && pct > 0,
      },
    })
  }

  const focusNextAfter = (code: string, nowSolved: Set<string>) => {
    const start = list.findIndex((c) => c.code === code)
    const rest = [...list.slice(start + 1), ...list.slice(0, start)]
    const next = rest.find((c) => !nowSolved.has(c.code))
    const el = next && inputs.current.get(next.code)
    if (el) {
      el.focus({ preventScroll: true })
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const solve = (c: Country, typo: boolean) => {
    const next = new Set(solved).add(c.code)
    setSolved(next)
    recordAnswer(c.code, true)
    feedback.correct()
    setMood(next.size === total ? 'party' : 'happy')
    setReaction((r) => r + 1)
    setSpellNote(typo ? `Close enough! It's spelled “${c.name}” 😉` : null)
    if (next.size === total) setTimeout(() => finish(false), 1500)
    else focusNextAfter(c.code, next)
  }

  const onType = (c: Country, value: string) => {
    if (matchCountry(value, c) === 'exact') solve(c, false)
  }

  const onEnter = (c: Country, value: string) => {
    const r = matchCountry(value, c)
    if (r !== 'wrong') return solve(c, r === 'close')
    if (!value.trim()) return focusNextAfter(c.code, solved) // empty: skip to the next flag
    setWrongCode(c.code)
    setMood('sad')
    setReaction((n) => n + 1)
    setSpellNote(null)
    feedback.wrong()
    setTimeout(() => setWrongCode(null), 450)
  }

  const giveUp = () => {
    if (!confirm(`Show the answers for the ${total - solved.size} flags you haven't named yet?`)) return
    setRevealed(true)
    setMood('sad')
    setReaction((r) => r + 1)
  }

  const leave = () => {
    if (solved.size === 0 || revealed || confirm('Leave for now? Your answers are saved — pick Type It with the same filters to carry on.'))
      navigate({ name: 'home' })
  }

  const pandaSay =
    spellNote ??
    (mood === 'happy' ? `${solved.size} down, ${total - solved.size} to go!` : mood === 'sad' ? (revealed ? 'Here are the answers. Let’s learn them!' : 'Not that one. Try again!') : undefined)

  return (
    <main className="flex flex-1 flex-col">
      {done && <Confetti />}
      {/* Sticky header so progress and actions are always in reach while scrolling */}
      <div className="sticky top-0 z-10 -mx-4 bg-cream/95 px-4 pt-1 pb-2 backdrop-blur">
        <header className="flex items-center gap-3">
          <button
            onClick={leave}
            aria-label="Back"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-white text-xl font-black shadow-[0_3px_0_var(--color-ink)] active:translate-y-[3px] active:shadow-none"
          >
            ←
          </button>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <h1 className="text-xl font-extrabold">⌨️ Type It</h1>
              <span className="font-black tabular-nums">
                {solved.size}/{total}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-white">
              <div className="h-full bg-bamboo transition-[width]" style={{ width: `${(solved.size / total) * 100}%` }} />
            </div>
          </div>
        </header>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex shrink-0 rounded-full border-[3px] border-ink bg-white p-0.5" role="radiogroup" aria-label="Order">
            {(['az', 'random'] as Order[]).map((o) => (
              <button
                key={o}
                role="radio"
                aria-checked={order === o}
                onClick={() => setOrder(o)}
                className={`rounded-full px-3 py-1 text-sm font-extrabold ${order === o ? 'bg-yellow-300' : ''}`}
              >
                {o === 'az' ? '🔤 A–Z' : '🔀 Random'}
              </button>
            ))}
          </div>
          {!revealed && (
            <button className="chip shrink-0 text-sm" aria-pressed={hideSolved} onClick={() => setHideSolved((h) => !h)}>
              🙈 Hide done
            </button>
          )}
          {!revealed ? (
            <button className="chip shrink-0 bg-rose-100 text-sm" onClick={giveUp} disabled={done}>
              🏳️ Give up
            </button>
          ) : (
            <button className="chip shrink-0 bg-bamboo text-sm text-white" onClick={() => finish(true)}>
              See results 🏁
            </button>
          )}
        </div>
      </div>

      <div className="my-2 min-h-[64px]">
        <Panda
          mood={mood}
          size={56}
          reactionKey={reaction}
          say={pandaSay ?? (solved.size ? null : 'Type each country under its flag. No timer, no rush! 🐼')}
        />
      </div>

      <ul className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3">
        {visible.map((c) => {
          const isSolved = solved.has(c.code)
          return (
            <li
              key={c.code}
              className={`flex flex-col gap-2 rounded-2xl border-[3px] border-ink p-2 shadow-[0_4px_0_var(--color-ink)] ${
                isSolved ? 'bg-green-200' : revealed ? 'bg-rose-100' : 'bg-white'
              } ${wrongCode === c.code ? 'shake' : ''}`}
            >
              <Flag country={c} variant="thumb" revealName={isSolved || revealed} />
              {isSolved || revealed ? (
                <p className={`flex min-h-11 items-center justify-center text-center leading-tight font-extrabold ${isSolved ? 'pop-in' : 'text-rose-700'}`}>
                  {isSolved ? '✓ ' : ''}
                  {c.name}
                </p>
              ) : (
                <input
                  ref={(el) => {
                    if (el) inputs.current.set(c.code, el)
                    else inputs.current.delete(c.code)
                  }}
                  onChange={(e) => onType(c, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      onEnter(c, e.currentTarget.value)
                    }
                  }}
                  aria-label="Country name for this flag"
                  placeholder="Country?"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="words"
                  spellCheck={false}
                  enterKeyHint="next"
                  className="min-h-11 w-full rounded-xl border-2 border-ink bg-white px-2 text-center text-base font-bold outline-none focus:bg-yellow-50 focus:ring-4 focus:ring-yellow-300"
                />
              )}
            </li>
          )
        })}
      </ul>
      {hideSolved && visible.length === 0 && !done && <p className="text-center font-bold">All named! 🎉</p>}
    </main>
  )
}
