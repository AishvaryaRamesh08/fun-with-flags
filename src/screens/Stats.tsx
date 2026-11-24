import type { Navigate } from '../App'
import { Panda } from '../components/Panda'
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

      <Panda mood="happy" size={72} say={p.gamesPlayed ? `${mastered} flags mastered so far!` : 'Play a game and your stats will show up here!'} />

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat value={p.gamesPlayed} label="games" />
        <Stat value={`🔥${p.dayStreak.count}`} label="day streak" />
        <Stat value={answers ? `${Math.round((right / answers) * 100)}%` : '–'} label="accuracy" />
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-lg font-extrabold">Mastered by continent</h2>
        <ul className="flex flex-col gap-2">
          {CONTINENTS.map((cont) => {
            const all = ALL_COUNTRIES.filter((c) => c.continent === cont)
            const m = all.filter((c) => isMastered(p.countries[c.code])).length
            return (
              <li key={cont}>
                <div className="flex justify-between text-sm font-extrabold">
                  <span>{cont}</span>
                  <span>
                    {m}/{all.length}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full border-2 border-ink bg-slate-100">
                  <div className="h-full bg-bamboo" style={{ width: `${(m / all.length) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs font-semibold text-slate-500">A flag is mastered after 3 correct answers in a row.</p>
      </section>

      <section className="card overflow-x-auto p-4">
        <h2 className="mb-2 text-lg font-extrabold">🏆 Best scores</h2>
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
              <tr key={m} className="border-t-2 border-slate-100">
                <td className="py-1.5">{MODE_INFO[m].emoji} {MODE_INFO[m].title}</td>
                {DIFFS.map((d) => (
                  <td key={d} className="text-center">{p.bestPercent[bestKey(m, d)] !== undefined ? `${p.bestPercent[bestKey(m, d)]}%` : '–'}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t-2 border-slate-100">
              <td className="py-1.5">⚡ Blitz (points)</td>
              {DIFFS.map((d) => (
                <td key={d} className="text-center">{p.blitzBest[d] ?? '–'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="text-lg font-extrabold">⚙️ Settings</h2>
        <Toggle label="🔊 Sounds" on={p.settings.sound} onChange={(v) => setSetting('sound', v)} />
        <Toggle label="📳 Vibration" on={p.settings.vibration} onChange={(v) => setSetting('vibration', v)} />
        <button
          className="btn mt-1 bg-rose-100 text-base"
          onClick={() => confirm('Erase all your scores, streaks and review deck on this device? This can’t be undone.') && resetProgress()}
        >
          🗑️ Reset my progress
        </button>
      </section>

      <p className="text-center text-xs font-semibold text-slate-500">
        Flags from flag-icons · Country data from mledoze/countries · Made with 🎋 by Bao
      </p>
    </main>
  )
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="card px-2 py-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-bold text-slate-500">{label}</p>
    </div>
  )
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center justify-between text-base font-extrabold">
      {label}
      <span className={`relative h-8 w-14 rounded-full border-[3px] border-ink transition-colors ${on ? 'bg-bamboo' : 'bg-slate-200'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full border-2 border-ink bg-white transition-all ${on ? 'left-7' : 'left-0.5'}`} />
      </span>
    </button>
  )
}
