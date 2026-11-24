import type { Navigate } from '../App'
import { Mascot } from '../components/Mascot'
import { TopBar } from '../components/TopBar'
import { CONTINENTS } from '../data/types'
import { ALL_COUNTRIES } from '../game/engine'
import { DIFFICULTY_INFO, MODE_INFO, type Difficulty, type Mode } from '../game/types'
import { bestKey, isMastered, resetProgress, setSetting, useProgress } from '../store/progress'

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard']
const QUIZ_MODES: Mode[] = ['flag-to-name', 'name-to-flag', 'type-it', 'capital']

export function Stats({ navigate }: { navigate: Navigate }) {
  const p = useProgress()
  const mastered = ALL_COUNTRIES.filter((c) => isMastered(p.countries[c.code])).length
  const seen = Object.values(p.countries)
  const answers = seen.reduce((n, c) => n + c.seen, 0)
  const right = seen.reduce((n, c) => n + c.correct, 0)

  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <TopBar title="📊 Your progress" onBack={() => navigate({ name: 'home' })} />

      <Mascot mood="happy" size={72} say={p.gamesPlayed ? `${mastered} flags mastered so far!` : 'Play a game and your stats will show up here!'} />

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat value={p.gamesPlayed} label="games" />
        <Stat value={`🔥${p.dayStreak.count}`} label="day streak" />
        <Stat value={answers ? `${Math.round((right / answers) * 100)}%` : '–'} label="accuracy" />
      </section>

      <section className="card p-4">
        <h2 className="display mb-3 text-xl">Mastered by continent</h2>
        <ul className="flex flex-col gap-2">
          {CONTINENTS.map((cont) => {
            const all = ALL_COUNTRIES.filter((c) => c.continent === cont)
            const m = all.filter((c) => isMastered(p.countries[c.code])).length
            return (
              <li key={cont}>
                <div className="mb-1 flex justify-between font-cond text-sm uppercase">
                  <span>{cont}</span>
                  <span>
                    {m}/{all.length}
                  </span>
                </div>
                <div className="bar">
                  <div style={{ width: `${(m / all.length) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-muted">A flag is mastered after 3 correct answers in a row.</p>
      </section>

      <section className="card overflow-x-auto p-4">
        <h2 className="display mb-2 text-xl">🏆 Best scores</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-1">Game</th>
              {DIFFS.map((d) => (
                <th key={d} className="py-1 text-center">{DIFFICULTY_INFO[d].label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="font-semibold">
            {QUIZ_MODES.map((m) => (
              <tr key={m} className="border-t border-line">
                <td className="py-1.5">{MODE_INFO[m].emoji} {MODE_INFO[m].title}</td>
                {DIFFS.map((d) => (
                  <td key={d} className="text-center">{p.bestPercent[bestKey(m, d)] !== undefined ? `${p.bestPercent[bestKey(m, d)]}%` : '–'}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-line">
              <td className="py-1.5">⚡ Blitz (points)</td>
              {DIFFS.map((d) => (
                <td key={d} className="text-center">{p.blitzBest[d] ?? '–'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="display text-xl">⚙️ Settings</h2>
        <Toggle label="🔊 Sounds" on={p.settings.sound} onChange={(v) => setSetting('sound', v)} />
        <Toggle label="📳 Vibration" on={p.settings.vibration} onChange={(v) => setSetting('vibration', v)} />
        <button
          className="btn btn-ghost mt-1 text-base text-wrong"
          onClick={() => confirm('Erase all your scores, streaks and review deck on this device? This can’t be undone.') && resetProgress()}
        >
          🗑️ Reset my progress
        </button>
      </section>

      <p className="text-center text-xs text-muted">
        Flags from flag-icons · Country data from mledoze/countries · Made with ▓▓ by Byte
      </p>
    </main>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="card px-2 py-3">
      <p className="display text-3xl">{value}</p>
      <p className="font-cond text-xs text-muted uppercase">{label}</p>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center justify-between font-cond text-lg uppercase">
      {label}
      <span className={`relative h-8 w-14 rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent' : 'border-line bg-raised'}`}>
        <span className={`absolute top-[3px] h-5 w-5 rounded-full transition-all ${on ? 'left-7 bg-on-accent' : 'left-[3px] bg-muted'}`} />
      </span>
    </button>
  )
}
