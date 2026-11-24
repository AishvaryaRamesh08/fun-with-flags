import type { Navigate } from '../App'
import { Panda } from '../components/Panda'
import { ALL_COUNTRIES } from '../game/engine'
import { MODE_INFO, type Mode } from '../game/types'
import { isMastered, reviewCodes, useProgress } from '../store/progress'

const QUIZ_MODES: { mode: Mode; color: string }[] = [
  { mode: 'flag-to-name', color: 'bg-sky-300' },
  { mode: 'name-to-flag', color: 'bg-pink-300' },
  { mode: 'type-it', color: 'bg-violet-300' },
  { mode: 'capital', color: 'bg-orange-300' },
]

export function Home({ navigate }: { navigate: Navigate }) {
  const progress = useProgress()
  const review = reviewCodes(progress).length
  const mastered = ALL_COUNTRIES.filter((c) => isMastered(progress.countries[c.code])).length
  const firstVisit = progress.gamesPlayed === 0

  return (
    <main className="flex flex-1 flex-col gap-5 pb-4">
      <div className="flex items-center justify-between pt-1">
        <h1 className="text-3xl leading-none font-extrabold tracking-tight text-bamboo-dark">
          Fun with <span className="text-ink">Flags</span>
        </h1>
        <div className="flex gap-2 text-sm font-extrabold">
          {progress.dayStreak.count > 0 && (
            <span className="chip flex items-center bg-orange-100" title="Days in a row">
              🔥 {progress.dayStreak.count}
            </span>
          )}
          <button onClick={() => navigate({ name: 'stats' })} className="chip" aria-label="Stats and settings">
            📊
          </button>
        </div>
      </div>

      <Panda
        mood="wave"
        size={110}
        say={firstVisit ? "Hi! I'm Bao 🐼 Let's learn the flags of the world together!" : undefined}
      />

      <section className="card p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-extrabold">Flags mastered</span>
          <span className="font-extrabold text-bamboo-dark">
            {mastered} / {ALL_COUNTRIES.length}
          </span>
        </div>
        <div className="mt-2 h-4 overflow-hidden rounded-full border-2 border-ink bg-slate-100">
          <div className="h-full bg-bamboo transition-[width]" style={{ width: `${(mastered / ALL_COUNTRIES.length) * 100}%` }} />
        </div>
      </section>

      <button onClick={() => navigate({ name: 'setup', mode: 'blitz' })} className="btn w-full bg-yellow-300 py-4 text-2xl">
        ⚡ 60-second Blitz
      </button>

      <section aria-label="Quiz modes" className="grid grid-cols-2 gap-3">
        {QUIZ_MODES.map(({ mode, color }) => (
          <button
            key={mode}
            onClick={() => navigate({ name: 'setup', mode })}
            className={`btn min-h-32 flex-col gap-0.5 px-2 py-3 text-center leading-tight ${color}`}
          >
            <span className="text-3xl">{MODE_INFO[mode].emoji}</span>
            <span>{MODE_INFO[mode].title}</span>
            <span className="text-xs font-bold opacity-75">{MODE_INFO[mode].blurb}</span>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button onClick={() => navigate({ name: 'flashcards' })} className="btn btn-white">
          🃏 Flashcards
        </button>
        <button
          onClick={() => navigate({ name: 'flashcards', reviewOnly: true })}
          className="btn btn-white relative disabled:opacity-50"
          disabled={review === 0}
        >
          🔁 Review
          {review > 0 && (
            <span className="absolute -top-2 -right-2 grid h-7 min-w-7 place-items-center rounded-full border-2 border-ink bg-rose-400 px-1 text-sm text-white">
              {review}
            </span>
          )}
        </button>
      </section>

      <p className="mt-auto text-center text-xs font-semibold text-slate-500">
        No ads. No login. Your progress stays on this device. 🐼
      </p>
    </main>
  )
}
