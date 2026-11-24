import { useMemo, useRef, useState } from 'react'
import type { Navigate } from '../App'
import { FlashCard } from '../components/FlashCard'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { TopBar } from '../components/TopBar'
import { CONTINENTS, type Continent, type Country } from '../data/types'
import { ALL_COUNTRIES, countryByCode } from '../game/engine'
import { shuffle } from '../game/random'
import { isMastered, recordAnswer, reviewCodes, useProgress } from '../store/progress'

type View = 'one' | 'grid'
const VIEW_KEY = 'fun-with-flags:flashcard-view'

interface Props {
  navigate: Navigate
  /** Start in "review deck" mode (countries you got wrong) */
  reviewOnly?: boolean
  /** A fixed set of cards, e.g. the flags missed in the last game */
  only?: Country[]
}

export function Flashcards({ navigate, reviewOnly = false, only }: Props) {
  const progress = useProgress()
  const [view, setViewState] = useState<View>(() => (localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'one'))
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

  // One-at-a-time state
  const [pos, setPos] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(0)
  // Grid state: only one card can be open at a time
  const [openCode, setOpenCode] = useState<string | null>(null)

  const card = deck[Math.min(pos, deck.length - 1)]

  const setView = (v: View) => {
    localStorage.setItem(VIEW_KEY, v)
    setViewState(v)
    setOpenCode(null)
    setFlipped(false)
  }
  const go = (delta: number) => {
    setFlipped(false)
    setPos((p) => Math.max(0, Math.min(deck.length - 1, p + delta)))
  }
  const mark = (knewIt: boolean) => {
    recordAnswer(card.code, knewIt)
    setDone((d) => d + 1)
    if (pos < deck.length - 1) go(1)
    else {
      // End of the deck: start again from the first card
      setFlipped(false)
      setPos(0)
    }
  }
  const resetFilters = (fn: () => void) => {
    fn()
    setPos(0)
    setFlipped(false)
    setOpenCode(null)
  }

  // Swipe left/right to change cards (one-at-a-time mode)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const dy = e.changedTouches[0].clientY - touch.current.y
    touch.current = null
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1)
  }

  const title = only ? 'Practise' : review ? 'Review deck' : 'Flashcards'

  return (
    <main className="flex flex-1 flex-col">
      <TopBar
        title={title}
        onBack={() => navigate({ name: 'home' })}
        right={
          deck.length > 1 && (
            <button className="chip" onClick={() => resetFilters(() => setShuffleSeed((s) => s + 1))} aria-label="Shuffle cards">
              <Icon name="shuffle" />
            </button>
          )
        }
      />

      {/* View switch */}
      <div className="mb-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Card view">
        {(['one', 'grid'] as View[]).map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={view === v}
            onClick={() => setView(v)}
            className="chip"
          >
            <Icon name={v === 'one' ? 'card' : 'grid'} /> {v === 'one' ? 'One at a time' : 'All flags'}
          </button>
        ))}
      </div>

      {!only && (
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-2">
          <button className="chip shrink-0" aria-pressed={review} onClick={() => resetFilters(() => setReview((r) => !r))}>
            <Icon name="review" /> Review only
          </button>
          <button className="chip shrink-0" aria-pressed={continent === null} onClick={() => resetFilters(() => setContinent(null))}>
            All
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
          <Mascot mood="eyeroll" size={124} say={review ? 'Nothing to review. I’m as surprised as you are.' : 'No cards here.'} />
          <button className="btn btn-primary w-full" onClick={() => navigate({ name: 'home' })}>
            Back home
          </button>
        </div>
      ) : view === 'grid' ? (
        <>
          <p className="mb-2 text-center font-cond text-sm text-muted uppercase">
            {deck.length} flags · tap one to flip it
          </p>
          <ul className="grid grid-cols-2 items-start gap-3 pb-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {deck.map((c) => (
              <li key={c.code} className={openCode === c.code ? 'relative z-10' : undefined}>
                <FlashCard
                  size="small"
                  country={c}
                  flipped={openCode === c.code}
                  onToggle={() => setOpenCode((cur) => (cur === c.code ? null : c.code))}
                />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="mx-auto w-full max-w-md">
          <p className="mb-2 text-center font-cond text-sm text-muted uppercase">
            Card {pos + 1} of {deck.length}
            {done > 0 && ` · ${done} practised`}
            {isMastered(progress.countries[card.code]) && (
              <>
                {' · '}
                <Icon name="star" /> mastered
              </>
            )}
          </p>

          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <FlashCard key={card.code} country={card} flipped={flipped} onToggle={() => setFlipped((f) => !f)} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button className="btn btn-ghost" onClick={() => mark(false)}>
              <Icon name="down" /> Not yet
            </button>
            <button className="btn btn-primary" onClick={() => mark(true)}>
              <Icon name="up" /> Got it
            </button>
          </div>
          <div className="mt-3 flex justify-between">
            <button className="chip" onClick={() => go(-1)} disabled={pos === 0}>
              <Icon name="prev" /> Prev
            </button>
            <span className="self-center font-cond text-xs text-muted uppercase">Swipe to browse</span>
            <button className="chip" onClick={() => go(1)} disabled={pos >= deck.length - 1}>
              Next <Icon name="next" />
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
