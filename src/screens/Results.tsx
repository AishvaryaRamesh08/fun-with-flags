import { useState } from 'react'
import type { Navigate } from '../App'
import { Confetti } from '../components/Confetti'
import { Flag } from '../components/Flag'
import { Icon } from '../components/Icon'
import { Mascot } from '../components/Mascot'
import { RESULT_MOOD, resultLine, resultTier } from '../game/persona'
import { DIFFICULTY_INFO, MODE_INFO } from '../game/types'
import type { GameResult } from './Play'

export function Results({ result, navigate }: { result: GameResult; navigate: Navigate }) {
  const { settings, score, correct, answered, total, bestStreak, missed, newBest } = result
  const blitz = settings.mode === 'blitz'
  const pct = Math.round((correct / Math.max(blitz ? answered : total, 1)) * 100)
  // The verdict and his face always match: eye-roll at a perfect score ("too easy"), smug, eye-roll, face-palm
  const tier = resultTier(answered > 0 ? pct : 0)
  const mood = RESULT_MOOD[tier]
  // Chosen once for this results screen (he never praises, even a perfect score)
  const [message] = useState(() => resultLine(tier))

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 pb-4">
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
          <ul className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-x-6 md:[&>li:nth-child(2)]:border-t-0 md:[&>li:nth-child(2)]:pt-0">
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
