import type { Navigate } from '../App'
import { Icon, type IconName } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { TopBar } from '../components/TopBar'
import { CONTINENTS } from '../data/types'
import { ALL_COUNTRIES } from '../game/engine'
import { DIFFICULTY_INFO, MODE_INFO, type Difficulty, type Mode } from '../game/types'
import { bestKey, isMastered, resetProgress, setSetting, setTheme, useProgress, type ThemeName } from '../store/progress'

const DIFFS: Difficulty[] = ['easy', 'medium', 'hard']
const QUIZ_MODES: Mode[] = ['flag-to-name', 'name-to-flag', 'type-it', 'capital']

/** Preview colours for the theme picker: background, accent, text */
const THEMES: { id: ThemeName; label: string; colors: [string, string, string] }[] = [
  { id: 'paper', label: 'Paper', colors: ['#f3ebde', '#b8461a', '#1d1812'] },
  { id: 'clay', label: 'Clay', colors: ['#1a1918', '#e07b55', '#f2efe8'] },
  { id: 'amber', label: 'Amber', colors: ['#0b0805', '#ffa62b', '#ffd9a3'] },
  { id: 'phosphor', label: 'Phosphor', colors: ['#060b07', '#3dff73', '#d2ffdc'] },
]

export function Stats({ navigate }: { navigate: Navigate }) {
  const p = useProgress()
  const mastered = ALL_COUNTRIES.filter((c) => isMastered(p.countries[c.code])).length
  const seen = Object.values(p.countries)
  const answers = seen.reduce((n, c) => n + c.seen, 0)
  const right = seen.reduce((n, c) => n + c.correct, 0)

  return (
    <main className="flex flex-1 flex-col gap-4 pb-6">
      <TopBar title="Your progress" onBack={() => navigate({ name: 'home' })} />

      <Mascot mood="happy" size={96} say={p.gamesPlayed ? `${mastered} flags mastered. I had all 195 by age six. Just saying.` : 'No games yet. Your record is as blank as a white flag.'} />

      <section className="grid grid-cols-3 gap-2 text-center">
        <Stat value={p.gamesPlayed} label="games" />
        <Stat value={p.dayStreak.count} label="day streak" />
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
        <h2 className="display mb-2 flex items-center gap-2 text-xl"><Icon name="trophy" className="text-accent" /> Best scores</h2>
        <p className="mb-2 text-xs text-muted">All continents. Filtered rounds show their own best on the game setup screen.</p>
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
                <td className="py-1.5"><Icon name={MODE_INFO[m].icon} className="mr-1.5 text-accent" />{MODE_INFO[m].title}</td>
                {DIFFS.map((d) => (
                  <td key={d} className="text-center">{p.bestPercent[bestKey(m, d)] !== undefined ? `${p.bestPercent[bestKey(m, d)]}%` : '–'}</td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-line">
              <td className="py-1.5"><Icon name="zap" className="mr-1.5 text-accent" />Blitz (points)</td>
              {DIFFS.map((d) => (
                <td key={d} className="text-center">{p.blitzBest[d] ?? '–'}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <section className="card flex flex-col gap-3 p-4">
        <h2 className="display flex items-center gap-2 text-xl"><Icon name="settings" className="text-accent" /> Settings</h2>
        <div>
          <p className="mb-2 font-cond text-sm uppercase">Theme</p>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Colour theme">
            {THEMES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={p.theme === t.id}
                onClick={() => setTheme(t.id)}
                className={`tile flex flex-col items-center gap-1.5 p-1.5 ${p.theme === t.id ? '!border-accent' : ''}`}
              >
                <span
                  aria-hidden
                  className="flex h-10 w-full items-center justify-center rounded-[2px] font-display text-2xl"
                  style={{ background: t.colors[0], color: t.colors[2] }}
                >
                  <span style={{ color: t.colors[1] }}>&gt;</span>_
                </span>
                <span className="font-cond text-[11px] uppercase">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
        <Toggle icon="sound" label="Sounds" on={p.settings.sound} onChange={(v) => setSetting('sound', v)} />
        <Toggle icon="vibrate" label="Vibration" on={p.settings.vibration} onChange={(v) => setSetting('vibration', v)} />
        <button
          className="btn btn-ghost mt-1 text-base text-wrong"
          onClick={() => confirm('Erase all your scores, streaks and review deck on this device? This can’t be undone.') && resetProgress()}
        >
          <Icon name="trash" /> Reset my progress
        </button>
      </section>

      <p className="text-center text-xs text-muted">
        Flags from flag-icons · Icons from Pixelarticons · Country data from mledoze/countries
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

function Toggle({ icon, label, on, onChange }: { icon: IconName; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center justify-between font-cond text-lg uppercase">
      <span className="flex items-center gap-2">
        <Icon name={icon} className="text-accent" /> {label}
      </span>
      <span className={`relative h-8 w-14 rounded-full border-2 transition-colors ${on ? 'border-accent bg-accent' : 'border-line bg-raised'}`}>
        <span className={`absolute top-[3px] h-5 w-5 rounded-full transition-all ${on ? 'left-7 bg-on-accent' : 'left-[3px] bg-muted'}`} />
      </span>
    </button>
  )
}
