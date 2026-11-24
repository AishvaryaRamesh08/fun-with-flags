import { useMemo, useRef, useState } from 'react'
import type { Navigate } from '../App'
import { Flag } from '../components/Flag'
import { Panda } from '../components/Panda'
import { TopBar } from '../components/TopBar'
import { CONTINENTS, type Continent, type Country } from '../data/types'
import { ALL_COUNTRIES, countryByCode } from '../game/engine'
import { shuffle } from '../game/random'
import { isMastered, recordAnswer, reviewCodes, useProgress } from '../store/progress'

interface Props {
  navigate: Navigate
  /** Start in "review deck" mode (countries you got wrong) */
  reviewOnly?: boolean
  /** A fixed set of cards, e.g. the flags missed in the last game */
  only?: Country[]
}

export function Flashcards({ navigate, reviewOnly = false, only }: Props) {
  const progress = useProgress()
  const [continent, setContinent] = useState<Continent | null>(null)
  const [review, setReview] = useState(reviewOnly)
  const [shuffleSeed, setShuffleSeed] = useState(0)

  // The deck is fixed when filters change, so cards don't vanish mid-session as you mark them
  const deck = useMemo(() => {
    let cards = only ?? ALL_COUNTRIES
    if (!only && review) cards = reviewCodes().map((c) => countryByCode(c)!).filter(Boolean)
    if (continent) cards = cards.filter((c) => c.continent === continent)
    return shuffleSeed ? shuffle(cards) : [...cards].sort((a, b) => a.name.localeCompare(b.name))
  }, [only, review, continent, shuffleSeed])

  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  const card = deck[Math.min(pos, deck.length - 1)]

  const go = (delta: number) => {
    setFlipped(false)
    setPos((p) => Math.max(0, Math.min(deck.length - 1, p + delta)))
  }
  const mark = (knewIt: boolean) => {
    recordAnswer(card.code, knewIt)
    setDone((d) => d + 1)
    if (pos < deck.length - 1) go(1)
    else setFlipped(false)
  }
  const resetFilters = (fn: () => void) => {
    fn()
    setPos(0)
    setFlipped(false)
  }

  // Swipe left/right to change cards
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  const title = only ? '🃏 Practise' : review ? '🔁 Review deck' : '🃏 Flashcards'

  return (
    <main className="flex flex-1 flex-col">
      <TopBar
        title={title}
        onBack={() => navigate({ name: 'home' })}
        right={
          deck.length > 1 && (
            <button className="chip" onClick={() => resetFilters(() => setShuffleSeed((s) => s + 1))} aria-label="Shuffle cards">
              🔀
            </button>
          )
        }
      />

      {!only && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-2">
          <button className="chip shrink-0" aria-pressed={review} onClick={() => resetFilters(() => setReview((r) => !r))}>
            🔁 Review only
          </button>
          <button className="chip shrink-0" aria-pressed={continent === null} onClick={() => resetFilters(() => setContinent(null))}>
            🌐 All
          </button>
          {CONTINENTS.map((c) => (
            <button key={c} className="chip shrink-0" aria-pressed={continent === c} onClick={() => resetFilters(() => setContinent(c))}>
              {c}
            </button>
          ))}
        </div>
      )}

      {!card ? (
        <div className="mt-6 flex flex-col items-center gap-4 text-center">
          <Panda mood="happy" size={110} say={review ? 'No flags to review — you’re all caught up! 🎉' : 'No cards here.'} />
          <button className="btn btn-primary w-full" onClick={() => navigate({ name: 'home' })}>
            Back home
          </button>
        </div>
      ) : (
        <>
          <p className="mb-2 text-center text-sm font-extrabold text-slate-500">
            Card {pos + 1} of {deck.length}
            {done > 0 && ` · ${done} practised`}
            {isMastered(progress.countries[card.code]) && ' · ⭐ mastered'}
          </p>

          <div className="flip-scene" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <button
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? 'Show flag side' : 'Flip card to see the answer'}
              className={`flip-card relative grid w-full text-left ${flipped ? 'flipped' : ''}`}
            >
              {/* Front: the flag */}
              <div className="flip-face card col-start-1 row-start-1 flex min-h-[420px] flex-col items-center justify-center gap-5 p-5">
                <Flag country={card} />
                <p className="text-lg font-extrabold text-slate-500">Which country? Tap to flip 👆</p>
              </div>
              {/* Back: everything about the country */}
              <div className="flip-face flip-back card col-start-1 row-start-1 flex min-h-[420px] flex-col gap-3 bg-yellow-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-20 shrink-0">
                    <Flag country={card} revealName variant="thumb" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-2xl leading-tight font-black">{card.name}</p>
                    <p className="text-sm font-bold text-slate-500">{card.continent} · {card.subregion}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-base">
                  <dt className="font-extrabold">🏛️ Capital</dt>
                  <dd className="font-semibold">
                    {card.capitals.join(', ')}
                    {card.capitalNote && <span className="block text-xs text-slate-500">{card.capitalNote}</span>}
                  </dd>
                  <dt className="font-extrabold">💰 Currency</dt>
                  <dd className="font-semibold">
                    {card.currency.name} ({card.currency.symbol} {card.currency.code})
                  </dd>
                </dl>
                <p className="rounded-2xl border-2 border-ink bg-white p-3 leading-snug font-semibold">
                  <span className="font-extrabold">💡 Remember it: </span>
                  {card.hint}
                </p>
                <p className="rounded-2xl border-2 border-ink bg-sky-50 p-3 leading-snug font-semibold">
                  <span className="font-extrabold">🤓 Fun fact: </span>
                  {card.funFact}
                </p>
              </div>
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="btn bg-rose-200" onClick={() => mark(false)}>
              😅 Still learning
            </button>
            <button className="btn bg-green-300" onClick={() => mark(true)}>
              😎 Got it!
            </button>
          </div>
          <div className="mt-3 flex justify-between">
            <button className="chip" onClick={() => go(-1)} disabled={pos === 0}>
              ← Prev
            </button>
            <span className="self-center text-xs font-bold text-slate-500">Swipe to browse</span>
            <button className="chip" onClick={() => go(1)} disabled={pos >= deck.length - 1}>
              Next →
            </button>
          </div>
        </>
      )}
    </main>
  )
}
