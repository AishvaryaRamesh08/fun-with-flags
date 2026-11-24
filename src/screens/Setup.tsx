import { useState } from 'react'
import type { Navigate } from '../App'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { TopBar } from '../components/TopBar'
import { CONTINENTS, type Continent } from '../data/types'
import { questionPool } from '../game/engine'
import { DIFFICULTY_INFO, MODE_INFO, type Difficulty, type GameSettings, type Mode } from '../game/types'
import { bestKey, getProgress, useProgress } from '../store/progress'

const COUNTS = [10, 20, 30, 0]
const MODES: Mode[] = ['flag-to-name', 'name-to-flag', 'type-it', 'capital', 'blitz']

export function Setup({ initialMode, navigate }: { initialMode: Mode; navigate: Navigate }) {
  const last = getProgress().lastSettings
  const progress = useProgress()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [continents, setContinents] = useState<Continent[]>(last?.continents ?? [])
  // Type It lists every flag on one page, so it starts with all of them (Hard)
  const [difficulty, setDifficulty] = useState<Difficulty>(initialMode === 'type-it' ? 'hard' : (last?.difficulty ?? 'easy'))
  const [count, setCount] = useState(last?.count ?? 10)

  const pool = questionPool({ continents, difficulty })
  const poolSizes = Object.fromEntries(
    (['easy', 'medium', 'hard'] as Difficulty[]).map((d) => [d, questionPool({ continents, difficulty: d }).length]),
  ) as Record<Difficulty, number>
  const isBlitz = mode === 'blitz'
  const questions = count > 0 ? Math.min(count, pool.length) : pool.length
  const best = isBlitz ? progress.blitzBest[difficulty] : progress.bestPercent[bestKey(mode, difficulty)]

  const toggleContinent = (c: Continent) =>
    setContinents((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]))

  const start = () => {
    const settings: GameSettings = { mode, continents, difficulty, count }
    navigate({ name: 'play', settings, round: Date.now() })
  }

  return (
    <main className="flex flex-1 flex-col">
      <TopBar title={MODE_INFO[mode].title} onBack={() => navigate({ name: 'home' })} />

      <div className="flex flex-1 flex-col gap-5 pb-28">
        <Mascot
          mood="thinking"
          size={96}
          reactionKey={`${mode}${difficulty}${continents.join()}`}
          say={
            mode === 'type-it'
              ? `All ${pool.length} flags. No timer. Try not to embarrass us both.`
              : isBlitz
                ? `${pool.length} countries, 60 seconds. I’d need about 12.`
                : `${questions} question${questions === 1 ? '' : 's'}. I’ll try to contain my boredom.`
          }
        />

        <Section title="Game">
          <div className="grid grid-cols-2 gap-2">
            {MODES.map((m) => (
              <button key={m} className={`chip h-11 px-2 text-sm whitespace-nowrap ${m === 'blitz' ? 'col-span-2' : ''}`} aria-pressed={mode === m} onClick={() => setMode(m)}>
                <Icon name={MODE_INFO[m].icon} /> {MODE_INFO[m].title}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Continents" note={continents.length ? `${continents.length} picked` : 'All of them'}>
          <div className="grid grid-cols-2 gap-2">
            <button className="chip col-span-2 h-11 text-sm" aria-pressed={continents.length === 0} onClick={() => setContinents([])}>
              All continents
            </button>
            {CONTINENTS.map((c) => (
              <button key={c} className="chip h-11 px-2 text-sm whitespace-nowrap" aria-pressed={continents.includes(c)} onClick={() => toggleContinent(c)}>
                {c}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Difficulty">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Difficulty">
            {(Object.keys(DIFFICULTY_INFO) as Difficulty[]).map((d) => (
              <button
                key={d}
                role="radio"
                aria-checked={difficulty === d}
                onClick={() => setDifficulty(d)}
                className={`tile flex min-h-20 flex-col items-center justify-center gap-1 px-2 py-2 ${
                  difficulty === d ? 'is-right' : ''
                }`}
              >
                <span className="display text-xl">{DIFFICULTY_INFO[d].label}</span>
                <span className={`font-cond text-xs whitespace-nowrap uppercase ${difficulty === d ? '' : 'text-muted'}`}>{poolSizes[d]} countries</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">
            {DIFFICULTY_INFO[difficulty].blurb}
            {difficulty !== 'hard' && ' · Pick Hard to include every country.'}
          </p>
        </Section>

        {!isBlitz && mode !== 'type-it' && (
          <Section title="Questions">
            <div className="grid grid-cols-4 gap-2">
              {COUNTS.map((n) => (
                <button key={n} className="chip h-11 px-2 text-sm whitespace-nowrap" aria-pressed={count === n} onClick={() => setCount(n)}>
                  {n === 0 ? `All ${pool.length}` : n}
                </button>
              ))}
            </div>
          </Section>
        )}

        {best !== undefined && (
          <p className="text-center font-cond text-lg text-muted uppercase">
            <Icon name="trophy" /> Your best here: {isBlitz ? `${best} points` : `${best}%`}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md bg-bg/95 backdrop-blur px-4 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
        <button onClick={start} className="btn btn-primary w-full text-2xl">
          <Icon name={isBlitz ? 'zap' : mode === 'type-it' ? 'keyboard' : 'play'} />
          {isBlitz ? 'Start Blitz' : mode === 'type-it' ? 'Start typing' : 'Play'}
        </button>
      </div>
    </main>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="display text-xl">{title}</h2>
        {note && <span className="font-cond text-sm text-muted uppercase">{note}</span>}
      </div>
      {children}
    </section>
  )
}
