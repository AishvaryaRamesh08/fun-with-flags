import { useId, useMemo } from 'react'
import { MOOD_LINES, pick } from '../game/persona'

/**
 * Moonpie never looks pleased with you:
 * smug = half-lidded eyes, raised brow, smirk, "obviously" finger (after a right answer)
 * eyeroll = eyes rolled up, arms crossed, bored sigh (unimpressed, even by a perfect score)
 * facepalm = hand over face, eyes shut, head shake ("ugh, I knew you'd get that wrong")
 */
export type Mood = 'idle' | 'wave' | 'thinking' | 'smug' | 'eyeroll' | 'facepalm'

/**
 * Moonpie — an original paper-cutout cartoon: a lanky, self-declared genius who is
 * obsessed with flags, rude about your mistakes and allergic to giving compliments.
 * His lines live in game/persona.ts.
 */
export const MASCOT_NAME = 'Moonpie'

/*
 * Arm poses: shoulder → elbow → hand, in the drawing's 120×150 coordinate space.
 * "L" is the arm on the viewer's left. Hands are drawn at the last point.
 */
type Pt = [number, number]
type Hand = 'fist' | 'open' | 'point'
interface Arm {
  pts: [Pt, Pt, Pt]
  hand: Hand
}
const REST_L: Arm = { pts: [[31, 101], [25, 122], [33, 142]], hand: 'fist' }
const REST_R: Arm = { pts: [[89, 101], [95, 122], [87, 142]], hand: 'fist' }
const POSES: Record<Mood, { L: Arm; R: Arm }> = {
  idle: { L: REST_L, R: REST_R },
  wave: { L: { pts: [[31, 101], [15, 92], [16, 66]], hand: 'open' }, R: REST_R },
  thinking: { L: { pts: [[31, 101], [36, 120], [50, 86]], hand: 'fist' }, R: REST_R },
  smug: { L: { pts: [[31, 101], [17, 94], [22, 72]], hand: 'point' }, R: REST_R },
  // arms folded across the chest
  eyeroll: { L: { pts: [[31, 101], [44, 126], [74, 117]], hand: 'fist' }, R: { pts: [[89, 101], [76, 128], [46, 119]], hand: 'fist' } },
  facepalm: { L: REST_L, R: { pts: [[89, 101], [86, 84], [68, 52]], hand: 'open' } },
}
/** Arms drawn in front of the body/face for each mood (the rest are drawn behind) */
const FRONT: Record<Mood, ('L' | 'R')[]> = {
  idle: [],
  wave: [],
  thinking: ['L'],
  smug: [],
  eyeroll: ['R', 'L'],
  facepalm: ['R'],
}

const SKIN = '#f2c9a7'
const SKIN_SHADE = '#e0ad88'
const HAIR = '#3a2a1e'
const INK = '#2a2420'

interface Props {
  mood?: Mood
  /** Custom speech text; a random line for the mood is used if omitted, nothing if null */
  say?: string | null
  /** Height-ish size in px (the figure is a little taller than wide) */
  size?: number
  /** Changes whenever a new reaction should play, so the animation restarts */
  reactionKey?: string | number
}

export function Mascot({ mood = 'idle', say, size = 96, reactionKey }: Props) {
  const uid = useId().replace(/:/g, '')
  // A fresh line per reaction (never the same one twice in a row), only used when no `say` is given
  const useOwnLine = say === undefined
  const line = useMemo(
    () => (useOwnLine ? pick(MOOD_LINES[mood]) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mood, reactionKey, useOwnLine],
  )
  const text = say === null ? null : (say ?? line)
  const pose = POSES[mood]

  return (
    <div className="flex items-end gap-3" aria-live="polite">
      <svg
        key={`${mood}-${reactionKey}`}
        className={`cutout cutout-${mood} shrink-0`}
        width={size * 0.8}
        height={size}
        viewBox="0 0 120 150"
        role="img"
        aria-label={`${MASCOT_NAME} looks ${LABEL[mood]}`}
      >
        <defs>
          {/* Paper cut-out look: a rough white paper border around the whole figure plus a soft drop shadow */}
          <filter id={`paper-${uid}`} x="-15%" y="-15%" width="130%" height="130%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="3.4" result="grow" />
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="1" seed="7" result="noise" />
            <feDisplacementMap in="grow" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="rough" />
            <feFlood floodColor="#fffdf7" />
            <feComposite in2="rough" operator="in" result="paper" />
            <feDropShadow in="paper" dx="1.6" dy="2.6" stdDeviation="1.3" floodColor="#000" floodOpacity="0.3" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <pattern id={`stripes-${uid}`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">
            <rect width="6" height="6" fill="#7b8190" />
            <rect width="3" height="6" fill="#5c6170" />
          </pattern>
        </defs>

        <g filter={`url(#paper-${uid})`}>
          <g className="cut-body">
            {/* Arms behind the torso */}
            {!FRONT[mood].includes('L') && <ArmShape arm={pose.L} stripes={`stripes-${uid}`} className="cut-arm-l" />}
            {!FRONT[mood].includes('R') && <ArmShape arm={pose.R} stripes={`stripes-${uid}`} className="cut-arm-r" />}

            {/* T-shirt in the theme colour, with a pennant emblem */}
            <path d="M24 100 Q30 92 46 90 L74 90 Q90 92 96 100 L100 150 L20 150 Z" fill="var(--color-accent)" />
            <path d="M22 100 L34 96 L36 114 L22 116 Z" fill="var(--color-accent)" />
            <path d="M98 100 L86 96 L84 114 L98 116 Z" fill="var(--color-accent)" />
            <circle cx="60" cy="118" r="12" fill="none" stroke="rgb(0 0 0 / 0.35)" strokeWidth="2.5" />
            <path d="M55 111 L55 126 M55 111 L67 115 L55 119" fill="none" stroke="rgb(0 0 0 / 0.35)" strokeWidth="2.5" strokeLinejoin="round" />

            {/* A strip of tape holding the cut-out to the page */}
            <rect x="80" y="88" width="26" height="9" rx="1" fill="rgb(255 244 214 / 0.8)" transform="rotate(32 93 92)" />

            {/* Neck */}
            <rect x="53" y="78" width="14" height="16" rx="3" fill={SKIN_SHADE} />

            {/* Head */}
            <g className="cut-head">
              <ellipse cx="37.5" cy="58" rx="4" ry="6" fill={SKIN} />
              <ellipse cx="82.5" cy="58" rx="4" ry="6" fill={SKIN} />
              <ellipse cx="60" cy="56" rx="22" ry="26" fill={SKIN} />
              {/* Neat, side-parted hair */}
              <path d="M38 54 Q36 28 60 27 Q85 27 83 52 Q81 42 72 38 Q62 35 50 39 Q42 43 38 54 Z" fill={HAIR} />
              <path d="M50 39 Q53 33 58 30" fill="none" stroke="#5a4535" strokeWidth="1.2" />
              <Face mood={mood} />
            </g>

            {/* Arms in front: hand on chin, folded arms, face-palm */}
            {FRONT[mood].map((side) => (
              <ArmShape key={side} arm={pose[side]} stripes={`stripes-${uid}`} className={side === 'L' ? 'cut-arm-l' : 'cut-arm-r'} />
            ))}
          </g>
        </g>

      </svg>

      {text && (
        <div
          key={`b-${mood}-${reactionKey}-${text}`}
          className="panda-bubble mb-6 min-w-0 flex-1 rounded-[var(--radius-ui)] border-2 border-accent bg-surface px-3 py-2 text-[13px] leading-snug text-fg"
        >
          {text}
        </div>
      )}
    </div>
  )
}

const LABEL: Record<Mood, string> = {
  idle: 'smug',
  wave: 'smug, waving',
  thinking: 'skeptical',
  smug: 'smug',
  eyeroll: 'unimpressed, rolling his eyes',
  facepalm: 'exasperated, face-palming',
}

function Face({ mood }: { mood: Mood }) {
  // Eyebrows carry most of the attitude: one raised brow = "really?"
  const brows: Record<Mood, [string, string]> = {
    idle: ['M46 47 L55 47', 'M65 45 L74 46'],
    wave: ['M46 47 L55 47', 'M65 44 L74 45'],
    thinking: ['M46 48 L55 48', 'M65 43 L74 45'],
    smug: ['M46 47 L55 47', 'M65 42 L74 44'],
    eyeroll: ['M46 46 Q50 43 55 45', 'M65 45 Q69 43 74 46'],
    facepalm: ['M46 44 L55 48', 'M65 48 L74 44'],
  }
  const mouths: Record<Mood, string> = {
    idle: 'M52 70 Q59 72 68 67', // lopsided smirk
    wave: 'M52 70 Q59 72 68 66',
    thinking: 'M54 71 L66 70',
    smug: 'M52 71 Q59 72 69 65',
    eyeroll: 'M53 72 L66 70 Q68 69.5 69 71', // bored, pulled to one side
    facepalm: 'M52 73 Q60 69 68 73', // grimace
  }
  return (
    <g stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none">
      <path d={brows[mood][0]} />
      <path d={brows[mood][1]} />
      <Eyes mood={mood} />
      <path d="M60 58 Q62 63 58 65" strokeWidth="1.6" />
      <path d={mouths[mood]} />
    </g>
  )
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'smug' || mood === 'wave' || mood === 'idle') {
    // half-closed, superior eyes: just the lower half of each eye under a heavy lid
    return (
      <g className={mood === 'smug' ? undefined : 'cut-eyes'}>
        <path d="M48.4 57 A2.6 2.8 0 0 0 53.6 57 Z" fill={INK} stroke="none" />
        <path d="M66.4 57 A2.6 2.8 0 0 0 71.6 57 Z" fill={INK} stroke="none" />
        <path d="M47.5 57 L54.5 56.6 M65.5 56.6 L72.5 57" strokeWidth="1.8" />
      </g>
    )
  }
  if (mood === 'eyeroll') {
    // whites showing, pupils rolled right up
    return (
      <g stroke="none">
        <ellipse cx="51" cy="56" rx="3.6" ry="4" fill="#fff" stroke={INK} strokeWidth="1" />
        <ellipse cx="69" cy="56" rx="3.6" ry="4" fill="#fff" stroke={INK} strokeWidth="1" />
        <circle cx="51.6" cy="53.2" r="1.7" fill={INK} />
        <circle cx="69.6" cy="53.2" r="1.7" fill={INK} />
      </g>
    )
  }
  if (mood === 'facepalm') {
    // squeezed shut
    return <path d="M47 56 L51 57.5 L55 56 M65 56 L69 57.5 L73 56" strokeWidth="1.8" />
  }
  // thinking: eyes glance up and aside
  return (
    <g className="cut-eyes" fill={INK} stroke="none">
      <ellipse cx="53" cy="54" rx="2.4" ry="2.8" />
      <ellipse cx="71" cy="54" rx="2.4" ry="2.8" />
    </g>
  )
}

function ArmShape({ arm, stripes, className }: { arm: Arm; stripes: string; className: string }) {
  const [a, b, c] = arm.pts
  return (
    <g className={className}>
      <polyline points={`${a.join(',')} ${b.join(',')} ${c.join(',')}`} fill="none" stroke={`url(#${stripes})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      {arm.hand === 'open' ? (
        <g fill={SKIN}>
          <ellipse cx={c[0]} cy={c[1] - 3} rx="6" ry="8" />
          <rect x={c[0] - 6} y={c[1] - 13} width="12" height="8" rx="3" />
        </g>
      ) : arm.hand === 'point' ? (
        <g fill={SKIN}>
          <circle cx={c[0]} cy={c[1]} r="5.5" />
          <rect x={c[0] - 1.8} y={c[1] - 14} width="3.6" height="11" rx="1.8" />
        </g>
      ) : (
        <circle cx={c[0]} cy={c[1]} r="5.5" fill={SKIN} />
      )}
    </g>
  )
}
