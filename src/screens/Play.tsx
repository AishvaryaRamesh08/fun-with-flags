import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Navigate } from '../App'
import { Flag } from '../components/Flag'
import { feedback } from '../components/feedback'
import { Icon } from '../components/Icon'
import { Mascot, type Mood } from '../components/Mascot'
import type { Country } from '../data/types'
import { BlitzDeck, blitzPoints, buildQuiz } from '../game/engine'
import { rightLine, streakLine, wrongLine } from '../game/persona'
import { BLITZ_SECONDS, type GameSettings, type Question } from '../game/types'
import { bestKey, getProgress, recordAnswer, recordGame } from '../store/progress'

export interface GameResult {
  settings: GameSettings
  /** Correct answers, or points in Blitz */
  score: number
  correct: number
  answered: number
  total: number
  bestStreak: number
  missed: Country[]
  newBest: boolean
}

interface Answer {
  chosen?: string
  correct: boolean
}

export function Play({ settings, navigate }: { settings: GameSettings; navigate: Navigate }) {
  const blitz = settings.mode === 'blitz'
  const deck = useMemo(() => (blitz ? new BlitzDeck(settings) : null), [blitz, settings])
  const quiz = useMemo(() => (blitz ? [] : buildQuiz(settings)), [blitz, settings])

  const [index, setIndex] = useState(0)
  const [qid, setQid] = useState(0)
  const [question, setQuestion] = useState<Question>(() => (deck ? deck.next() : quiz[0]))
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [stats, setStats] = useState({ correct: 0, answered: 0, points: 0, streak: 0, bestStreak: 0 })
  const missed = useRef<Country[]>([])
  const [mood, setMood] = useState<Mood>('thinking')
  const [reaction, setReaction] = useState(0)
  /** What Moonpie is saying right now (null = nothing). Chosen once per event so it never flickers. */
  const [line, setLine] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(BLITZ_SECONDS)
  const finished = useRef(false)
  const advanceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  // Don't jump to a new question (or the results) after the player has left the game
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(advanceTimer.current)
    }
  }, [])

  const finish = useCallback(
    (final: typeof stats) => {
      if (finished.current || !mounted.current) return
      finished.current = true
      const p = getProgress()
      const total = blitz ? final.answered : quiz.length
      const score = blitz ? final.points : final.correct
      const prevBest = blitz ? (p.blitzBest[settings.difficulty] ?? 0) : (p.bestPercent[bestKey(settings.mode, settings.difficulty)] ?? 0)
      const thisScore = blitz ? score : Math.round((score / Math.max(total, 1)) * 100)
      recordGame(settings, score, total)
      feedback.finish()
      navigate({
        name: 'results',
        result: {
          settings,
          score,
          correct: final.correct,
          answered: final.answered,
          total,
          bestStreak: final.bestStreak,
          missed: missed.current,
          newBest: thisScore > prevBest && thisScore > 0,
        },
      })
    },
    [blitz, navigate, quiz.length, settings],
  )

  // Blitz countdown
  const statsRef = useRef(stats)
  useEffect(() => {
    statsRef.current = stats
  }, [stats])
  useEffect(() => {
    if (!blitz) return
    const end = Date.now() + BLITZ_SECONDS * 1000
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setTimeLeft((prev) => {
        if (left !== prev && left <= 5 && left > 0) feedback.tick()
        return left
      })
      if (left === 0) {
        clearInterval(id)
        finish(statsRef.current)
      }
    }, 200)
    return () => clearInterval(id)
  }, [blitz, finish])

  const next = useCallback(() => {
    setAnswer(null)
    setMood('thinking')
    setQid((q) => q + 1)
    const streak = statsRef.current.streak
    setLine(streak >= 3 ? streakLine(streak) : null)
    if (deck) {
      setQuestion(deck.next())
      return
    }
    if (index + 1 >= quiz.length) {
      finish(statsRef.current)
      return
    }
    setIndex(index + 1)
    setQuestion(quiz[index + 1])
  }, [deck, finish, index, quiz])

  const submit = (a: Answer) => {
    if (answer || finished.current) return
    setAnswer(a)
    recordAnswer(question.country.code, a.correct)
    if (!a.correct) missed.current = [...missed.current.filter((c) => c !== question.country), question.country]
    setStats((s) => {
      const streak = a.correct ? s.streak + 1 : 0
      return {
        correct: s.correct + (a.correct ? 1 : 0),
        answered: s.answered + 1,
        points: s.points + (a.correct ? blitzPoints(s.streak) : 0),
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
      }
    })
    setMood(a.correct ? 'happy' : 'sad')
    setReaction((r) => r + 1)
    setLine(a.correct ? rightLine() : wrongLine(question.kind === 'capital' ? question.country.capitals[0] : question.country.name))
    if (a.correct) feedback.correct()
    else feedback.wrong()
    // Keep it snappy: right = green and on, wrong = red + the right answer in green, then on.
    advanceTimer.current = setTimeout(next, blitz ? (a.correct ? 450 : 1100) : a.correct ? 600 : 1500)
  }

  // Desktop keyboard: 1–4 to answer, Enter for next
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const n = Number(e.key)
      if (!answer && n >= 1 && n <= question.options.length) submit({ chosen: question.options[n - 1].code, correct: question.options[n - 1] === question.country })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const quit = () => {
    if (stats.answered === 0 || confirm('Quit this game? Your answers so far are still saved for review.')) navigate({ name: 'home' })
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Top bar: quit, progress / timer, score */}
      <header className="mb-2 flex items-center gap-3">
        <button onClick={quit} className="icon-btn">
          <Icon name="close" label="Quit game" />
        </button>
        {blitz ? (
          <div className="flex flex-1 items-center gap-2">
            <div className="bar flex-1">
              <div
                style={{
                  width: `${(timeLeft / BLITZ_SECONDS) * 100}%`,
                  ...(timeLeft <= 10 && { background: 'repeating-linear-gradient(to right, var(--color-wrong) 0 6px, transparent 6px 8px)' }),
                }}
              />
            </div>
            <span className={`display w-12 text-right text-2xl tabular-nums ${timeLeft <= 10 ? 'text-wrong' : ''}`}>{timeLeft}s</span>
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-2">
            <div className="bar flex-1">
              <div style={{ width: `${((index + (answer ? 1 : 0)) / quiz.length) * 100}%` }} />
            </div>
            <span className="display text-xl tabular-nums">
              {index + 1}/{quiz.length}
            </span>
          </div>
        )}
        <span className="chip px-3 tabular-nums" aria-label="Score">
          <Icon name="star" /> {blitz ? stats.points : stats.correct}
        </span>
      </header>

      <div className="mb-2 flex h-[96px] items-end">
        <Mascot mood={mood} size={88} reactionKey={reaction} say={line} />
      </div>

      <QuestionView key={qid} question={question} answer={answer} onAnswer={submit} />

    </main>
  )
}

function QuestionView({ question, answer, onAnswer }: { question: Question; answer: Answer | null; onAnswer: (a: Answer) => void }) {
  const { kind, country, options } = question
  const choose = (o: Country) => onAnswer({ chosen: o.code, correct: o === country })

  const mark = (o: Country) =>
    !answer ? null : o === country ? <Icon name="check" className="mr-1" /> : o.code === answer.chosen ? <Icon name="close" className="mr-1" /> : null
  const optionClass = (o: Country) => {
    if (!answer) return ''
    if (o === country) return 'is-right pop-in'
    if (o.code === answer.chosen) return 'is-wrong shake'
    return 'is-dimmed'
  }

  if (kind === 'name-to-flag') {
    return (
      <section className="flex flex-col gap-4">
        <div className="card flex min-h-28 flex-col items-center justify-center px-4 py-4 text-center">
          <p className="font-cond text-sm text-muted uppercase">Find the flag of</p>
          <p className="display line-clamp-2 text-4xl">{country.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((o, i) => (
            <button
              key={o.code}
              onClick={() => choose(o)}
              disabled={!!answer}
              aria-label={`Option ${i + 1}`}
              className={`tile flex flex-col gap-1.5 p-2 disabled:active:scale-100 ${optionClass(o)}`}
            >
              <Flag country={o} revealName={!!answer} variant="thumb" />
              {/* Name slot is always there (empty until answered) so tiles never change size */}
              <span className="flex h-9 items-center justify-center font-cond text-sm leading-tight uppercase">
                <span className="line-clamp-2">
                  {answer && (
                    <>
                      {mark(o)}
                      {o.name}
                    </>
                  )}
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="mx-auto w-full max-w-[340px]">
        <Flag country={country} revealName={!!answer} />
      </div>
      <p className="text-center font-cond text-xl uppercase">
        {kind === 'capital' ? (
          <>
            Capital of <span className="text-accent">{country.name}</span>?
          </>
        ) : (
          'Which country is this?'
        )}
      </p>

      <div className="grid gap-3">
        {options.map((o) => (
          <button
            key={o.code}
            onClick={() => choose(o)}
            disabled={!!answer}
            className={`tile flex h-16 items-center justify-center px-3 text-center font-cond text-xl leading-tight uppercase disabled:active:scale-100 ${optionClass(o)}`}
          >
            {mark(o)}
            {kind === 'capital' ? o.capitals[0] : o.name}
          </button>
        ))}
      </div>
    </section>
  )
}
