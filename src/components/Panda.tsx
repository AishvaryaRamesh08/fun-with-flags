import { useMemo } from 'react'

export type Mood = 'idle' | 'happy' | 'sad' | 'thinking' | 'party' | 'wave'

export const PANDA_NAME = 'Bao'

const LINES: Record<Mood, string[]> = {
  idle: ['Ready when you are!', 'Let’s learn some flags!', 'Pick a game and let’s go!'],
  wave: [`Hi! I’m ${PANDA_NAME} \u{1F44B}`, 'Welcome back, flag fan!', 'Hello again! Missed you!'],
  thinking: ['Hmm… which one is it?', 'Take your time!', 'Look closely at the details…', 'You’ve got this!'],
  happy: ['Yes! Nailed it! \u{1F389}', 'Bamboo-tastic! \u{1F38B}', 'Correct! You’re on fire \u{1F525}', 'Woohoo! \u{1F43C}', 'Flag master!'],
  sad: ['Oops! So close \u{1F97A}', 'Don’t worry, check the hint!', 'Aww, next one’s yours!', 'Tricky one! Let’s remember it.'],
  party: ['Amazing round! \u{1F38A}', 'You’re a flag superstar! ⭐', 'Party time! \u{1F973}'],
}

interface Props {
  mood?: Mood
  /** Custom speech bubble text; a random line for the mood is used if omitted */
  say?: string | null
  size?: number
  /** Changes whenever a new reaction should play, so the animation restarts */
  reactionKey?: string | number
}

export function Panda({ mood = 'idle', say, size = 120, reactionKey }: Props) {
  // A new random line per reaction (not per render)
  const line = useMemo(() => {
    const options = LINES[mood]
    return options[Math.floor(Math.random() * options.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, reactionKey])
  const text = say === null ? null : (say ?? line)

  return (
    <div className="flex items-end gap-2" aria-live="polite">
      <svg
        key={`${mood}-${reactionKey}`}
        className={`panda panda-${mood} shrink-0`}
        width={size}
        height={size}
        viewBox="0 -14 200 214"
        role="img"
        aria-label={`${PANDA_NAME} the panda looks ${mood}`}
      >
        {/* ears */}
        <circle cx="52" cy="42" r="24" fill="#1f2937" />
        <circle cx="148" cy="42" r="24" fill="#1f2937" />
        {/* body + arms */}
        <g className="panda-body">
          <ellipse cx="100" cy="168" rx="52" ry="34" fill="#fff" stroke="#1f2937" strokeWidth="4" />
          {mood === 'party' ? (
            <>
              <ellipse cx="44" cy="128" rx="13" ry="24" fill="#1f2937" transform="rotate(-35 44 128)" />
              <ellipse cx="156" cy="128" rx="13" ry="24" fill="#1f2937" transform="rotate(35 156 128)" />
            </>
          ) : mood === 'wave' ? (
            <>
              <ellipse cx="58" cy="168" rx="13" ry="22" fill="#1f2937" transform="rotate(25 58 168)" />
              {/* SVG transform on the group, CSS animation on the arm (CSS would otherwise replace the rotate) */}
              <g transform="rotate(35 156 128)">
                <ellipse className="panda-wave-arm" cx="156" cy="128" rx="13" ry="24" fill="#1f2937" />
              </g>
            </>
          ) : (
            <>
              <ellipse cx="58" cy="168" rx="13" ry="22" fill="#1f2937" transform="rotate(25 58 168)" />
              <ellipse cx="142" cy="168" rx="13" ry="22" fill="#1f2937" transform="rotate(-25 142 168)" />
            </>
          )}
        </g>
        {/* head */}
        <ellipse cx="100" cy="88" rx="72" ry="62" fill="#fff" stroke="#1f2937" strokeWidth="4" />
        {/* eye patches */}
        <ellipse cx="70" cy="86" rx="19" ry="24" fill="#1f2937" transform="rotate(-25 70 86)" />
        <ellipse cx="130" cy="86" rx="19" ry="24" fill="#1f2937" transform="rotate(25 130 86)" />
        <Eyes mood={mood} />
        {/* cheeks */}
        {(mood === 'happy' || mood === 'party' || mood === 'wave') && (
          <>
            <circle cx="52" cy="112" r="10" fill="#fda4af" opacity="0.8" />
            <circle cx="148" cy="112" r="10" fill="#fda4af" opacity="0.8" />
          </>
        )}
        {/* nose */}
        <ellipse cx="100" cy="106" rx="9" ry="6" fill="#1f2937" />
        <Mouth mood={mood} />
        {mood === 'sad' && <path className="panda-tear" d="M62 104 q-6 10 0 14 q6 -4 0 -14z" fill="#60a5fa" />}
        {mood === 'party' && (
          <g>
            <path d="M78 30 L100 -2 L122 30 Z" fill="#f472b6" stroke="#1f2937" strokeWidth="3" />
            <circle cx="100" cy="-2" r="6" fill="#facc15" />
          </g>
        )}
      </svg>
      {text && (
        <div
          key={`b-${mood}-${reactionKey}`}
          className="panda-bubble relative mb-8 rounded-2xl border-2 border-slate-800 bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-[3px_3px_0_#1f2937]"
        >
          {text}
          <span className="absolute -left-2 bottom-3 h-3 w-3 rotate-45 border-b-2 border-l-2 border-slate-800 bg-white" />
        </div>
      )}
    </div>
  )
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'happy' || mood === 'party') {
    // closed, smiling eyes: ^ ^
    return (
      <g stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M62 90 q9 -12 18 0" />
        <path d="M120 90 q9 -12 18 0" />
      </g>
    )
  }
  const look = mood === 'thinking' ? { dx: 4, dy: -6 } : mood === 'sad' ? { dx: 0, dy: 4 } : { dx: 0, dy: 0 }
  return (
    <g className="panda-eyes">
      <circle cx={72 + look.dx} cy={86 + look.dy} r="8" fill="#fff" />
      <circle cx={128 + look.dx} cy={86 + look.dy} r="8" fill="#fff" />
      <circle cx={73 + look.dx} cy={87 + look.dy} r="4" fill="#1f2937" />
      <circle cx={129 + look.dx} cy={87 + look.dy} r="4" fill="#1f2937" />
      <circle cx={70 + look.dx} cy={83 + look.dy} r="2" fill="#fff" />
      <circle cx={126 + look.dx} cy={83 + look.dy} r="2" fill="#fff" />
      {mood === 'sad' && (
        <g stroke="#1f2937" strokeWidth="4" strokeLinecap="round">
          <path d="M58 62 l20 6" />
          <path d="M142 62 l-20 6" />
        </g>
      )}
    </g>
  )
}

function Mouth({ mood }: { mood: Mood }) {
  const stroke = { stroke: '#1f2937', strokeWidth: 4, strokeLinecap: 'round' as const, fill: 'none' }
  switch (mood) {
    case 'happy':
    case 'wave':
      return <path d="M84 118 q16 16 32 0" {...stroke} />
    case 'party':
      return <path d="M82 116 q18 26 36 0 z" fill="#f43f5e" stroke="#1f2937" strokeWidth="4" strokeLinejoin="round" />
    case 'sad':
      return <path d="M86 126 q14 -12 28 0" {...stroke} />
    case 'thinking':
      return <path d="M92 122 h14" {...stroke} />
    default:
      return <path d="M90 116 q5 6 10 0 q5 6 10 0" {...stroke} />
  }
}
