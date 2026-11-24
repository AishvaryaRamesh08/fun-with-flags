import { useEffect, useMemo, useRef, useState } from 'react'
import type { Navigate } from '../App'
import { Confetti } from '../components/Confetti'
import { Flag } from '../components/Flag'
import { feedback } from '../components/feedback'
import { Icon } from '../components/Icon'
import { Mascot, type Mood } from '../components/Mascot'
import type { Country } from '../data/types'
import { countryByCode, questionPool } from '../game/engine'
import { matchCountry } from '../game/match'
import { TYPE_IT, pick, typeItSolved } from '../game/persona'
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
  /** What Moonpie says; chosen once per event */
  const [line, setLine] = useState<string | null>(null)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  /** Flags you typed a wrong answer for this game (each is added to the Review deck once) */
  const missedOnce = useRef(new Set<string>())
  // The automatic finish runs 1.5s after the last answer; skip it if you've left the page by then
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

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

  /** `finalSolved` is passed in because a delayed call would otherwise see a stale copy of `solved` */
  const finish = (finalSolved: Set<string> = solved) => {
    if (!mounted.current) return
    const missed = list.filter((c) => !finalSolved.has(c.code))
    const prevBest = getProgress().bestPercent[bestKey('type-it', settings.difficulty, settings.continents)] ?? 0
    const pct = Math.round((finalSolved.size / total) * 100)
    recordGame(settings, finalSolved.size, total)
    feedback.finish()
    navigate({
      name: 'results',
      result: {
        settings,
        score: finalSolved.size,
        correct: finalSolved.size,
        answered: total,
        total,
        bestStreak: finalSolved.size,
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
    setMood(next.size === total ? 'eyeroll' : 'smug')
    setReaction((r) => r + 1)
    setLine(typo ? TYPE_IT.typo.replace('{a}', c.name) : typeItSolved(next.size, total - next.size))
    if (next.size === total) setTimeout(() => finish(next), 1500)
    else focusNextAfter(c.code, next)
  }

  const onType = (c: Country, value: string) => {
    if (matchCountry(value, c) === 'exact') solve(c, false)
  }

  const onEnter = (c: Country, value: string) => {
    const r = matchCountry(value, c)
    if (r !== 'wrong') return solve(c, r === 'close')
    if (!value.trim()) return focusNextAfter(c.code, solved) // empty: skip to the next flag
    if (!missedOnce.current.has(c.code)) {
      missedOnce.current.add(c.code)
      recordAnswer(c.code, false)
    }
    setWrongCode(c.code)
    setMood('facepalm')
    setReaction((n) => n + 1)
    setLine(pick(TYPE_IT.wrong))
    feedback.wrong()
    setTimeout(() => setWrongCode(null), 450)
  }

  const giveUp = () => {
    if (!confirm(`Show the answers for the ${total - solved.size} flags you haven't named yet?`)) return
    setRevealed(true)
    setMood('facepalm')
    setReaction((r) => r + 1)
    setLine(pick(TYPE_IT.gaveUp))
  }

  /** Clear every answer on this page and start fresh (new random order too) */
  const restart = () => {
    if (solved.size > 0 && !revealed && !confirm(`Clear your ${solved.size} answer${solved.size === 1 ? '' : 's'} and start again?`)) return
    localStorage.removeItem(SAVE_KEY)
    navigate({ name: 'play', settings, round: Date.now() })
    window.scrollTo(0, 0)
  }

  const leave = () => {
    if (solved.size === 0 || revealed || confirm('Leave for now? Your answers are saved — pick Type It with the same filters to carry on.'))
      navigate({ name: 'home' })
  }

  return (
    <main className="flex flex-1 flex-col">
      {done && <Confetti />}
      {/* Sticky header so progress and actions are always in reach while scrolling */}
      <div className="sticky top-0 z-10 -mx-4 bg-bg/95 px-4 pt-1 pb-2 backdrop-blur">
        <header className="flex items-center gap-3">
          <button
            onClick={leave}
            aria-label="Back"
            className="icon-btn"
          >
            <Icon name="back" />
          </button>
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <h1 className="display text-[1.7rem]"><span className="text-accent">&gt; </span>Type It</h1>
              <span className="display text-xl tabular-nums">
                {solved.size}/{total}
              </span>
            </div>
            <div className="bar mt-1">
              <div style={{ width: `${(solved.size / total) * 100}%` }} />
            </div>
          </div>
        </header>
        <div className="mt-2 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Order">
          {(['az', 'random'] as Order[]).map((o) => (
            <button key={o} role="radio" aria-checked={order === o} onClick={() => setOrder(o)} className="chip h-10 text-sm">
              <Icon name={o === 'az' ? 'sort' : 'shuffle'} /> {o === 'az' ? 'A–Z' : 'Random'}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {!revealed && (
            <button className="chip h-10 px-1 text-xs whitespace-nowrap" aria-pressed={hideSolved} onClick={() => setHideSolved((h) => !h)}>
              <Icon name="eye" /> Hide done
            </button>
          )}
          <button className="chip h-10 px-1 text-xs whitespace-nowrap" onClick={restart}>
            <Icon name="restart" /> Restart
          </button>
          {!revealed ? (
            <button className="chip h-10 px-1 text-xs whitespace-nowrap" onClick={giveUp} disabled={done}>
              <Icon name="finish" /> Give up
            </button>
          ) : (
            <button className="chip col-span-2 h-10 text-xs" aria-pressed="true" onClick={() => finish()}>
              <Icon name="finish" /> See results
            </button>
          )}
        </div>
      </div>

      <div className="my-2 min-h-[80px]">
        <Mascot
          mood={mood}
          size={76}
          reactionKey={reaction}
          say={line ?? (solved.size ? null : TYPE_IT.intro)}
        />
      </div>

      <ul className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3">
        {visible.map((c) => {
          const isSolved = solved.has(c.code)
          return (
            <li
              key={c.code}
              className={`card flex flex-col gap-2 p-2 ${isSolved ? '!border-accent' : revealed ? '!border-wrong' : ''} ${
                wrongCode === c.code ? 'shake' : ''
              }`}
            >
              <Flag country={c} variant="thumb" revealName={isSolved || revealed} />
              {isSolved || revealed ? (
                <p
                  className={`flex h-11 items-center justify-center rounded-[10px] px-1 text-center font-cond leading-tight uppercase ${c.name.length > 24 ? 'text-[11px]' : 'text-sm'} ${
                    isSolved ? 'pop-in bg-accent text-on-accent' : 'bg-wrong-dim text-wrong'
                  }`}
                >
                  <span className="line-clamp-2">{c.name}</span>
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
                  className="h-11 w-full rounded-[10px] border-2 border-line bg-bg px-2 text-center text-base text-fg outline-none placeholder:text-muted focus:border-accent"
                />
              )}
            </li>
          )
        })}
      </ul>
      {hideSolved && visible.length === 0 && !done && <p className="text-center font-bold">All named.</p>}
    </main>
  )
}
