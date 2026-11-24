import type { Navigate } from '../App'
import { Confetti } from '../components/Confetti'
import { Flag } from '../components/Flag'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { DIFFICULTY_INFO, MODE_INFO } from '../game/types'
import type { GameResult } from './Play'

export function Results({ result, navigate }: { result: GameResult; navigate: Navigate }) {
  const { settings, score, correct, answered, total, bestStreak, missed, newBest } = result
  const blitz = settings.mode === 'blitz'
  const pct = Math.round((correct / Math.max(blitz ? answered : total, 1)) * 100)
  // His face matches his verdict: delighted, smug, skeptical, then face-palm
  const mood = pct >= 90 ? 'party' : pct >= 70 ? 'happy' : pct >= 40 ? 'thinking' : 'sad'
  const message =
    pct === 100 && answered > 0
      ? 'Flawless. I’d shake your hand, but… germs.'
      : pct >= 70
        ? 'Impressive. For someone who isn’t me.'
        : pct >= 40
          ? 'Mediocre. Review the flags you fumbled.'
          : 'That was painful to watch. Flashcards. Now.'

  return (
    <main className="flex flex-1 flex-col gap-4 pb-4">
      {(pct >= 70 || (newBest && pct >= 40)) && <Confetti />}
      <div className="pt-2">
        <Mascot mood={mood} size={132} say={message} />
      </div>

      <section className="card p-5 text-center">
        <p className="font-cond text-sm text-muted uppercase">
          {MODE_INFO[settings.mode].title} · {DIFFICULTY_INFO[settings.difficulty].label}
        </p>
        {blitz ? (
          <>
            <p className="display my-1 text-7xl text-accent">{score}</p>
            <p className="font-bold">points · {correct} of {answered} right</p>
          </>
        ) : (
          <>
            <p className="display my-1 text-7xl text-accent">
              {correct}/{total}
            </p>
            <p className="font-bold">{pct}% correct</p>
          </>
        )}
        <div className="mt-3 flex justify-center gap-2">
          {settings.mode !== 'type-it' && <span className="chip"><Icon name="fire" /> Best streak {bestStreak}</span>}
          {newBest && <span className="chip pop-in" aria-pressed="true"><Icon name="trophy" /> New best</span>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <button className="btn btn-primary" onClick={() => navigate({ name: 'play', settings, round: Date.now() })}>
          <Icon name="restart" /> Play again
        </button>
        <button className="btn btn-ghost" onClick={() => navigate({ name: 'home' })}>
          <Icon name="home" /> Home
        </button>
      </div>

      {missed.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="display text-xl whitespace-nowrap">To remember ({missed.length})</h2>
            <button className="chip shrink-0 text-sm whitespace-nowrap" onClick={() => navigate({ name: 'flashcards', only: missed })}>
              <Icon name="card" /> Practise
            </button>
          </div>
          <ul className="flex flex-col gap-3">
            {missed.map((c) => (
              <li key={c.code} className="flex items-center gap-3 border-t border-line pt-3 first:border-t-0 first:pt-0">
                <div className="w-20 shrink-0">
                  <Flag country={c} revealName variant="thumb" />
                </div>
                <div className="min-w-0">
                  <p className="font-cond text-sm leading-tight uppercase">
                    {c.name} <span className="text-accent">· {c.capitals[0]}</span>
                  </p>
                  <p className="text-xs leading-snug text-muted"><Icon name="hint" className="text-accent" /> {c.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
