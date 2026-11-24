import { useMemo } from 'react'
import { Typewriter } from './Typewriter'

export type Mood = 'idle' | 'happy' | 'sad' | 'thinking' | 'party' | 'wave'

export const MASCOT_NAME = 'Byte'

const LINES: Record<Mood, string[]> = {
  idle: ['ready when you are.', 'pick a game to start.', 'awaiting input...'],
  wave: [`hi! i'm ${MASCOT_NAME}. let's learn some flags.`, 'welcome back, flag fan.', 'booting up... ready!'],
  thinking: ['hmm... which one?', 'take your time.', 'look at the details...'],
  happy: ['[ok] nailed it!', '[ok] correct!', '[ok] +1 flag', '[ok] on fire!'],
  sad: ['[err] not quite.', '[err] so close!', '[err] check the hint.'],
  party: ['>>> round complete!', '>>> flag master!', '>>> great run!'],
}

/*
 * Pixel sprite, one character per pixel:
 *   # body (orange)   e eye (black)   w highlight (pale orange)   . empty
 * Each mood is its own 11×12 drawing. Rows 0–2 are headroom for the party hat and raised arms.
 */
const SPRITES: Record<Mood, string[]> = {
  idle: [
    '...........',
    '...........',
    '...........',
    '.#########.',
    '.#########.',
    '.##e###e##.',
    '###e###e###',
    '###########',
    '.#########.',
    '.#########.',
    '.#.#...#.#.',
    '.#.#...#.#.',
  ],
  thinking: [
    '...........',
    '...........',
    '...........',
    '.#########.',
    '.###e###e#.',
    '.###e###e#.',
    '###########',
    '###########',
    '.#########.',
    '.#########.',
    '.#.#...#.#.',
    '.#.#...#.#.',
  ],
  happy: [
    '...........',
    '...........',
    '#.........#',
    '##########.',
    '.#########.',
    '.##e###e##.',
    '.#e#e#e#e#.',
    '.#########.',
    '.#########.',
    '.#########.',
    '.#.#...#.#.',
    '.#.#...#.#.',
  ],
  sad: [
    '...........',
    '...........',
    '...........',
    '.#########.',
    '.#########.',
    '.#e#####e#.',
    '.##e###e##.',
    '.#w#######.',
    '##########.',
    '###########',
    '.#.#...#.#.',
    '.#.#...#.#.',
  ],
  party: [
    '.....w.....',
    '....www....',
    '#..wwwww..#',
    '##########.',
    '.#########.',
    '.##e###e##.',
    '.#e#e#e#e#.',
    '.#########.',
    '.#########.',
    '.#########.',
    '.#.#...#.#.',
    '.#.#...#.#.',
  ],
  wave: [
    '...........',
    '..........#',
    '..........#',
    '.#########.',
    '.#########.',
    '.##e###e##.',
    '###e###e##.',
    '###########',
    '.#########.',
    '.#########.',
    '.#.#...#.#.',
    '.#.#...#.#.',
  ],
}

const FILL: Record<string, string> = { '#': 'var(--color-accent)', e: '#0a0a0a', w: 'var(--color-fg)' }

interface Props {
  mood?: Mood
  /** Custom speech text; a random line for the mood is used if omitted, nothing if null */
  say?: string | null
  size?: number
  /** Changes whenever a new reaction should play, so the animation restarts */
  reactionKey?: string | number
}

export function Mascot({ mood = 'idle', say, size = 96, reactionKey }: Props) {
  const line = useMemo(() => {
    const options = LINES[mood]
    return options[Math.floor(Math.random() * options.length)]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, reactionKey])
  const text = say === null ? null : (say ?? line)
  const rows = SPRITES[mood]

  return (
    <div className="flex items-end gap-3" aria-live="polite">
      <svg
        key={`${mood}-${reactionKey}`}
        className={`panda panda-${mood} shrink-0`}
        width={size}
        height={size}
        viewBox="-0.5 0 12 12"
        shapeRendering="crispEdges"
        role="img"
        aria-label={`${MASCOT_NAME} looks ${mood}`}
      >
        {rows.flatMap((row, y) =>
          [...row].map((ch, x) =>
            ch === '.' ? null : (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1.02}
                height={1.02}
                fill={FILL[ch]}
                className={ch === 'e' && (mood === 'idle' || mood === 'thinking' || mood === 'wave') ? 'mascot-eye' : undefined}
              />
            ),
          ),
        )}
      </svg>
      {text && (
        <div
          key={`b-${mood}-${reactionKey}-${text}`}
          className="panda-bubble mb-6 min-w-0 flex-1 rounded-[var(--radius-ui)] border-2 border-accent bg-surface px-3 py-2 text-[13px] leading-snug text-fg"
        >
          <Typewriter text={text} />
        </div>
      )}
    </div>
  )
}
