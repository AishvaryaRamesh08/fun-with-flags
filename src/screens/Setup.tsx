import { useState } from 'react'
import type { Navigate } from '../App'
import { Panda } from '../components/Panda'
import { TopBar } from '../components/TopBar'
import { CONTINENTS, type Continent } from '../data/types'
import { questionPool } from '../game/engine'
import { DIFFICULTY_INFO, MODE_INFO, type Difficulty, type GameSettings, type Mode } from '../game/types'
import { bestKey, getProgress, useProgress } from '../store/progress'

const COUNTS = [10, 20, 30, 0]
const CONTINENT_EMOJI: Record<Continent, string> = {
  Africa: '🌍',
  Asia: '🌏',
  Europe: '🏰',
  'North America': '🗽',
  'South America': '🦜',
  Oceania: '🏝️',
}
const MODES: Mode[] = ['flag-to-name', 'name-to-flag', 'type-it', 'capital', 'blitz']

export function Setup({ initialMode, navigate }: { initialMode: Mode; navigate: Navigate }) {
  const last = getProgress().lastSettings
  const progress = useProgress()
  const [mode, setMode] = useState<Mode>(initialMode)
  const [continents, setContinents] = useState<Continent[]>(last?.continents ?? [])
  const [difficulty, setDifficulty] = useState<Difficulty>(last?.difficulty ?? 'easy')
  const [count, setCount] = useState(last?.count ?? 10)

  const pool = questionPool({ continents, difficulty })
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
      <TopBar title={`${MODE_INFO[mode].emoji} ${MODE_INFO[mode].title}`} onBack={() => navigate({ name: 'home' })} />

      <div className="flex flex-1 flex-col gap-5 pb-28">
        <Panda
          mood="thinking"
          size={72}
          reactionKey={`${mode}${difficulty}${continents.join()}`}
          say={
            isBlitz
              ? `${pool.length} countries in the mix. Answer as many as you can in 60s!`
              : `${questions} question${questions === 1 ? '' : 's'} from ${pool.length} countries. Let's go!`
          }
        />

        <Section title="Game">
          <div className="flex flex-wrap gap-2">
            {MODES.map((m) => (
              <button key={m} className="chip" aria-pressed={mode === m} onClick={() => setMode(m)}>
                {MODE_INFO[m].emoji} {MODE_INFO[m].title}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Continents" note={continents.length ? `${continents.length} picked` : 'All of them'}>
          <div className="flex flex-wrap gap-2">
            <button className="chip" aria-pressed={continents.length === 0} onClick={() => setContinents([])}>
              🌐 All
            </button>
            {CONTINENTS.map((c) => (
              <button key={c} className="chip" aria-pressed={continents.includes(c)} onClick={() => toggleContinent(c)}>
                {CONTINENT_EMOJI[c]} {c}
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
                className={`rounded-2xl border-[3px] border-ink px-2 py-2 font-extrabold ${
                  difficulty === d ? (d === 'easy' ? 'bg-green-300' : d === 'medium' ? 'bg-yellow-300' : 'bg-rose-300') : 'bg-white'
                }`}
              >
                {d === 'easy' ? '🌱' : d === 'medium' ? '🌿' : '🌳'} {DIFFICULTY_INFO[d].label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-600">{DIFFICULTY_INFO[difficulty].blurb}</p>
        </Section>

        {!isBlitz && (
          <Section title="Questions">
            <div className="grid grid-cols-4 gap-2">
              {COUNTS.map((n) => (
                <button key={n} className="chip px-2" aria-pressed={count === n} onClick={() => setCount(n)}>
                  {n === 0 ? `All ${pool.length}` : n}
                </button>
              ))}
            </div>
          </Section>
        )}

        {best !== undefined && (
          <p className="text-center font-bold text-slate-600">
            🏆 Your best here: {isBlitz ? `${best} points` : `${best}%`}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md bg-gradient-to-t from-cream via-cream to-transparent px-4 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
        <button onClick={start} className="btn btn-primary w-full text-2xl">
          {isBlitz ? '⚡ Start Blitz' : '▶ Play'}
        </button>
      </div>
    </main>
  )
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {note && <span className="text-sm font-bold text-slate-500">{note}</span>}
      </div>
      {children}
    </section>
  )
}
