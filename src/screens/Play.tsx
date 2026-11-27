import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Navigate } from '../App'
import { Flag } from '../components/Flag'
import { feedback } from '../components/feedback'
import { Icon } from '../components/Icon'
import { Mascot, type Mood } from '../components/Mascot'
import type { Country } from '../data/types'
import { blitzPoints, buildBlitz, buildQuiz } from '../game/engine'
import { BLITZ, pick, rightLine, wrongLine } from '../game/persona'
import { BLITZ_SECONDS, type GameSettings, type Question } from '../game/types'
import { answerPauseMs, bestKey, blitzKey, getProgress, recordAnswer, recordGame } from '../store/progress'

/** Length of the card swish-out before the next question appears (ms) */
const SWISH_MS = 260

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
  // Every mode is a fixed list with each country once; Blitz just races through it against the clock
  const quiz = useMemo(() => (blitz ? buildBlitz(settings) : buildQuiz(settings)), [blitz, settings])

  const [index, setIndex] = useState(0)
  const [qid, setQid] = useState(0)
  const [question, setQuestion] = useState<Question>(() => quiz[0])
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [stats, setStats] = useState({ correct: 0, answered: 0, points: 0, streak: 0, bestStreak: 0 })
  const missed = useRef<Country[]>([])
  const [mood, setMood] = useState<Mood>('thinking')
  const [reaction, setReaction] = useState(0)
  /** What Moonpie is saying right now (null = nothing). Chosen once per event so it never flickers. */
  const [line, setLine] = useState<string | null>(() => (blitz ? pick(BLITZ.start) : null))
  /** A Blitz clock remark (start / 45s / 30s / 10s left) stays up across questions until your next answer */
  const clockLine = useRef(blitz)
  /** Wrong answers in a row (for "Wrong again…") */
  const wrongRun = useRef(0)
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
      const prevBest = blitz
        ? (p.blitzBest[blitzKey(settings.difficulty, settings.continents)] ?? 0)
        : (p.bestPercent[bestKey(settings.mode, settings.difficulty, settings.continents)] ?? 0)
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
        // Moonpie gets impatient as the clock runs down
        if (left !== prev && (left === 45 || left === 30 || left === 10)) {
          clockLine.current = true
          setLine(pick(left === 45 ? BLITZ.early : left === 30 ? BLITZ.half : BLITZ.end))
          setMood('eyeroll')
          setReaction((r) => r + 1)
        }
        return left
      })
      if (left === 0) {
        clearInterval(id)
        finish(statsRef.current)
      }
    }, 200)
    return () => clearInterval(id)
  }, [blitz, finish])

  /** Swaps in the next question (or ends the game). Called once the old card has swished away. */
  const advance = useCallback(() => {
    setAnswer(null)
    setMood('thinking')
    setQid((q) => q + 1)
    // Clear his remark for the new question, unless it's a Blitz clock remark you haven't seen yet
    if (!clockLine.current) setLine(null)
    // No country is ever asked twice: when the list runs out the game ends (Blitz may end before 60s)
    if (index + 1 >= quiz.length) {
      finish(statsRef.current)
      return
    }
    setIndex(index + 1)
    setQuestion(quiz[index + 1])
  }, [finish, index, quiz])

  // Card transition: the answered card swishes off to the left, then the next one swishes in from the right
  const [leaving, setLeaving] = useState(false)
  const leavingRef = useRef(false)
  const next = useCallback(() => {
    if (leavingRef.current) return
    leavingRef.current = true
    setLeaving(true)
    advanceTimer.current = setTimeout(() => {
      leavingRef.current = false
      setLeaving(false)
      advance()
    }, SWISH_MS)
  }, [advance])

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
    setMood(a.correct ? 'smug' : 'facepalm')
    setReaction((r) => r + 1)
    clockLine.current = false
    wrongRun.current = a.correct ? 0 : wrongRun.current + 1
    const flagMode = question.kind !== 'capital'
    const said = a.correct
      ? rightLine(stats.streak + 1, flagMode)
      : wrongLine({
          answer: question.country,
          chosen: question.options.find((o) => o.code === a.chosen),
          flagMode,
          wrongStreak: wrongRun.current,
          blitz,
        })
    setLine(said)
    if (a.correct) feedback.correct()
    else feedback.wrong()
    // Pause to read Moonpie's remark, at the speed chosen in Settings (tapping anywhere skips ahead)
    advanceTimer.current = setTimeout(next, answerPauseMs(a.correct, blitz, said.length))
  }

  /** Skip the reading pause: move on now instead of waiting for the timer */
  const skipAhead = () => {
    if (!answer || finished.current || leavingRef.current) return
    clearTimeout(advanceTimer.current)
    next()
  }

  // Desktop keyboard: 1–4 to answer, Enter or Space to move on
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      if (answer && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        return skipAhead()
      }
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
    // After answering, a tap anywhere moves on (the click that answered doesn't count: `answer` was still empty then)
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col overflow-x-clip" onClick={skipAhead}>
      {/* Top bar: quit, progress / timer, score */}
      <header className="mb-2 flex items-center gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation() // quitting shouldn't also count as "tap to continue"
            quit()
          }}
          className="icon-btn"
        >
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

      <div key={qid} className={leaving ? 'card-swish-out' : 'card-swish-in'}>
        <QuestionView question={question} answer={answer} onAnswer={submit} />
      </div>
      {answer && <p className="mt-4 text-center font-cond text-xs text-muted uppercase">Tap anywhere to continue</p>}

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
          <p className={`display line-clamp-2 ${country.name.length > 24 ? 'text-3xl' : 'text-4xl'}`}>{country.name}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
              <span className={`flex h-9 items-center justify-center font-cond leading-tight uppercase ${o.name.length > 24 ? 'text-[11px]' : 'text-sm'}`}>
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
    <section className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-center lg:gap-10">
      <div className="mx-auto w-full max-w-[340px] lg:max-w-none">
        <Flag country={country} revealName={!!answer} />
      </div>
      <div className="flex flex-col gap-4">
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
      </div>
    </section>
  )
}
