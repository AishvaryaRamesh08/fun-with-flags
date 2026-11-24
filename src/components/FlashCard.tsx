import { useState } from 'react'
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
  const [extra, setExtra] = useState<'hint' | 'fact' | null>(null)
  const shownExtra = flipped ? extra : null // closing the card also closes the extra
  // In the grid, a tile is only as tall as the side facing up (the other side is taken out of the layout)
  const outOfFlow = 'absolute inset-x-0 top-0'
  const frontPos = !large && flipped ? outOfFlow : 'col-start-1 row-start-1'
  // (both positions let the corner icons and the hint overlay sit inside the back)
  const backPos = !large && !flipped ? outOfFlow : 'relative col-start-1 row-start-1'
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
            large ? 'min-h-[300px] gap-3 p-5 pb-14 shadow-[0_6px_0_var(--color-ink)]' : 'gap-1 p-2 pb-8 shadow-[0_4px_0_var(--color-ink)]'
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

          {/* Hint and fun fact: two small icons in the corner, opened only on tap */}
          <div className={`absolute flex gap-1.5 ${large ? 'right-3 bottom-3' : 'right-1.5 bottom-1.5'}`}>
            <ExtraIcon emoji="💡" label="Show hint to remember it" large={large} onOpen={() => setExtra('hint')} />
            <ExtraIcon emoji="🤓" label="Show fun fact" large={large} onOpen={() => setExtra('fact')} />
          </div>

          {shownExtra && (
            <div
              role="dialog"
              aria-label={shownExtra === 'hint' ? 'Remember it' : 'Fun fact'}
              onClick={(e) => {
                e.stopPropagation()
                setExtra(null)
              }}
              className={`pop-in absolute inset-0 flex flex-col overflow-y-auto rounded-[21px] bg-white text-left ${large ? 'gap-2 p-5' : 'gap-1 p-2'}`}
            >
              <p className={`flex items-center justify-between font-extrabold ${large ? 'text-lg' : 'text-xs'}`}>
                {shownExtra === 'hint' ? '💡 Remember it' : '🤓 Fun fact'}
                <span aria-hidden className="text-slate-400">✕</span>
              </p>
              <p className={`leading-snug font-semibold ${large ? 'text-lg' : 'text-xs'}`}>
                {shownExtra === 'hint' ? country.hint : country.funFact}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExtraIcon({ emoji, label, large, onOpen }: { emoji: string; label: string; large: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      className={`grid place-items-center rounded-full border-2 border-ink bg-white leading-none active:scale-90 ${large ? 'h-9 w-9 text-lg' : 'h-6 w-6 text-xs'}`}
    >
      {emoji}
    </button>
  )
}
