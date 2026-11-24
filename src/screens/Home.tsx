import type { Navigate } from '../App'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { Typewriter } from '../components/Typewriter'
import { ALL_COUNTRIES } from '../game/engine'
import { MODE_INFO, type Mode } from '../game/types'
import { isMastered, reviewCodes, useProgress } from '../store/progress'

const QUIZ_MODES: Mode[] = ['flag-to-name', 'name-to-flag', 'type-it', 'capital']

export function Home({ navigate }: { navigate: Navigate }) {
  const progress = useProgress()
  const review = reviewCodes(progress).length
  const mastered = ALL_COUNTRIES.filter((c) => isMastered(progress.countries[c.code])).length
  const firstVisit = progress.gamesPlayed === 0

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      <header className="pt-1">
        {/* Status row on top, then the title on its own full-width line */}
        <div className="mb-2 flex items-center justify-end gap-2">
          {progress.dayStreak.count > 0 && (
            <span className="chip px-3" title="Days in a row">
              <Icon name="fire" /> {progress.dayStreak.count}
            </span>
          )}
          <button onClick={() => navigate({ name: 'stats' })} className="icon-btn" aria-label="Stats and settings">
            <Icon name="stats" label="Stats and settings" />
          </button>
        </div>
        <h1 className="display text-[2.15rem] whitespace-nowrap">
          <span className="text-accent">&gt;</span> <Typewriter text="Fun with Flags" speed={45} cursor={false} />
        </h1>
      </header>

      <Mascot mood="wave" size={100} say={firstVisit ? "hi! i'm Byte. let's learn the flags of the world." : undefined} />

      <section className="card p-4">
        <div className="mb-2 flex items-baseline justify-between font-cond text-lg uppercase">
          <span>Flags mastered</span>
          <span className="text-accent">
            {mastered} / {ALL_COUNTRIES.length}
          </span>
        </div>
        <div className="bar">
          <div style={{ width: `${(mastered / ALL_COUNTRIES.length) * 100}%` }} />
        </div>
      </section>

      <button onClick={() => navigate({ name: 'setup', mode: 'blitz' })} className="btn btn-primary min-h-16 w-full text-3xl">
        <Icon name="zap" /> 60-second Blitz
      </button>

      <section aria-label="Quiz modes" className="grid grid-cols-2 gap-3">
        {QUIZ_MODES.map((mode) => (
          <button
            key={mode}
            onClick={() => navigate({ name: 'setup', mode })}
            className="tile flex aspect-square flex-col items-center justify-center gap-2 p-3 text-center"
          >
            <Icon name={MODE_INFO[mode].icon} className="text-4xl text-accent" />
            <span className="display flex h-11 items-center text-xl">{MODE_INFO[mode].title}</span>
            <span className="line-clamp-2 h-9 text-sm leading-tight text-muted">{MODE_INFO[mode].blurb}</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate({ name: 'flashcards' })} className="btn btn-ghost">
          <Icon name="card" /> Flashcards
        </button>
        <button
          onClick={() => navigate({ name: 'flashcards', reviewOnly: true })}
          className="btn btn-ghost relative disabled:opacity-40"
          disabled={review === 0}
        >
          <Icon name="review" /> Review
          {review > 0 && (
            <span className="absolute -top-2 -right-2 grid h-7 min-w-7 place-items-center rounded-full bg-accent px-1.5 font-cond text-sm text-on-accent">
              {review}
            </span>
          )}
        </button>
      </section>

      <p className="mt-auto text-center text-xs text-muted">No ads. No login. Your progress stays on this device.</p>
    </main>
  )
}
