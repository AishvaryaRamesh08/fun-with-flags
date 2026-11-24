import type { Country } from '../data/types'
import { Flag } from './Flag'

interface Props {
  country: Country
  flipped: boolean
  onToggle: () => void
  /** 'large' = one-at-a-time mode, 'small' = a tile in the all-flags grid */
  size?: 'large' | 'small'
}

/**
 * A flippable card: flag on the front; name, capital and currency on the back.
 * The hint and fun fact are folded away and only open if you tap them.
 */
export function FlashCard({ country, flipped, onToggle, size = 'large' }: Props) {
  const large = size === 'large'
  // In the grid, a tile is only as tall as the side facing up (the other side is taken out of the layout)
  const outOfFlow = 'absolute inset-x-0 top-0'
  const frontPos = !large && flipped ? outOfFlow : 'col-start-1 row-start-1'
  const backPos = !large && !flipped ? outOfFlow : 'col-start-1 row-start-1'
  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }

  return (
    <div className="flip-scene">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? `${country.name}. Tap to show the flag` : 'Flag card. Tap to see the answer'}
        onClick={onToggle}
        onKeyDown={onKey}
        className={`flip-card relative grid cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-yellow-300 ${flipped ? 'flipped' : ''}`}
      >
        {/* Front: the flag */}
        <div
          aria-hidden={flipped}
          className={`flip-face ${frontPos} flex flex-col items-center justify-center rounded-3xl border-[3px] border-ink bg-white ${flipped ? 'pointer-events-none' : ''} ${
            large ? 'min-h-[300px] gap-4 p-5 shadow-[0_6px_0_var(--color-ink)]' : 'p-2 shadow-[0_4px_0_var(--color-ink)]'
          }`}
        >
          <Flag country={country} variant={large ? 'hero' : 'thumb'} />
          {large && <p className="text-lg font-extrabold text-slate-500">Which country? Tap to flip 👆</p>}
        </div>

        {/* Back: just the essentials */}
        <div
          aria-hidden={!flipped}
          className={`flip-face flip-back ${backPos} flex flex-col justify-center rounded-3xl border-[3px] border-ink bg-yellow-100 text-center ${flipped ? '' : 'pointer-events-none'} ${
            large ? 'min-h-[300px] gap-3 p-5 shadow-[0_6px_0_var(--color-ink)]' : 'gap-1 p-2 shadow-[0_4px_0_var(--color-ink)]'
          }`}
        >
          <p className={`leading-tight font-black ${large ? 'text-4xl' : 'text-lg'}`}>{country.name}</p>
          <p className={`font-bold ${large ? 'text-xl' : 'text-sm leading-snug'}`}>
            🏛️ {country.capitals.join(' / ')}
          </p>
          <p className={`font-bold ${large ? 'text-xl' : 'text-sm leading-snug'}`}>
            💰 {country.currency.name}
            {large && ` (${country.currency.symbol})`}
          </p>

          {/* Optional extras, hidden until asked for */}
          <div className={`flex flex-col text-left ${large ? 'mt-2 gap-2' : 'mt-1 gap-1'}`} onClick={(e) => e.stopPropagation()}>
            <Extra label="💡 Remember it" text={country.hint} large={large} />
            <Extra label="🤓 Fun fact" text={country.funFact} large={large} />
          </div>
        </div>
      </div>
    </div>
  )
}

function Extra({ label, text, large }: { label: string; text: string; large: boolean }) {
  return (
    <details className={`group rounded-xl border-2 border-ink bg-white ${large ? 'px-3 py-2' : 'px-2 py-1'}`}>
      <summary className={`flex cursor-pointer list-none items-center justify-between font-extrabold select-none ${large ? 'text-base' : 'text-xs'}`}>
        {label}
        <span className="transition-transform group-open:rotate-180" aria-hidden>
          ▾
        </span>
      </summary>
      <p className={`mt-1 leading-snug font-semibold ${large ? 'text-base' : 'text-xs'}`}>{text}</p>
    </details>
  )
}
