import { useState } from 'react'
import type { Country } from '../data/types'
import { Flag } from './Flag'
import { Icon, type IconName } from './Icon'

interface Props {
  country: Country
  flipped: boolean
  onToggle: () => void
  /** 'large' = one-at-a-time mode, 'small' = a tile in the all-flags grid */
  size?: 'large' | 'small'
}

/**
 * A flippable card: flag on the front; name, capital and currency on the back.
 * Both sides are exactly the same size (a fixed frame), so every card in a grid lines up.
 * The hint and fun fact sit behind two small corner icons.
 */
export function FlashCard({ country, flipped, onToggle, size = 'large' }: Props) {
  const large = size === 'large'
  const [extra, setExtra] = useState<'hint' | 'fact' | null>(null)
  const shownExtra = flipped ? extra : null // closing the card also closes the extra

  const onKey = (e: React.KeyboardEvent) => {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onToggle()
    }
  }
  const long = country.name.length > 18
  const nameSize = large ? (long ? 'text-4xl' : 'text-5xl') : long ? 'text-[15px]' : 'text-lg'
  const face = 'flip-face absolute inset-0 flex flex-col rounded-[var(--radius-ui)] border-2'

  return (
    <div className="flip-scene">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? `${country.name}. Tap to show the flag` : 'Flag card. Tap to see the answer'}
        onClick={onToggle}
        onKeyDown={onKey}
        className={`flip-card relative w-full cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-accent ${
          large ? 'aspect-[4/4.2]' : 'aspect-[6/5]'
        } ${flipped ? 'flipped' : ''}`}
      >
        {/* Front: the flag */}
        <div
          aria-hidden={flipped}
          className={`${face} items-center justify-center border-line bg-surface ${large ? 'gap-5 p-5' : 'p-2'} ${flipped ? 'pointer-events-none' : ''}`}
        >
          <Flag country={country} variant={large ? 'hero' : 'thumb'} />
          {large && <p className="font-cond text-lg tracking-wide text-muted uppercase">Tap to flip</p>}
        </div>

        {/* Back: name, capital, currency */}
        <div
          aria-hidden={!flipped}
          className={`${face} flip-back items-center justify-center border-accent bg-raised text-center ${
            large ? 'gap-3 p-6 pb-14' : 'gap-0.5 p-2 pb-7'
          } ${flipped ? '' : 'pointer-events-none'}`}
        >
          {/* Anton's letters need ~1.3 line height or the clamp trims their tops; long names get a smaller size */}
          <p className={`display line-clamp-2 !leading-[1.3] ${nameSize}`}>{country.name}</p>
          <p className={`font-cond text-accent uppercase ${large ? 'line-clamp-2 text-2xl leading-tight' : 'line-clamp-1 text-sm'}`}>
            {large ? country.capitals.join(' / ') : country.capitals[0]}
          </p>
          <p className={`font-cond text-muted uppercase ${large ? 'line-clamp-2 text-xl leading-tight' : 'line-clamp-1 text-xs'}`}>
            {country.currency.name}
            {large && ` · ${country.currency.symbol}`}
          </p>

          <div className={`absolute flex gap-1.5 ${large ? 'right-3 bottom-3' : 'right-1.5 bottom-1.5'}`}>
            <ExtraIcon icon="hint" label="Show hint to remember it" large={large} onOpen={() => setExtra('hint')} />
            <ExtraIcon icon="fact" label="Show fun fact" large={large} onOpen={() => setExtra('fact')} />
          </div>

          {shownExtra && (
            <div
              role="dialog"
              aria-label={shownExtra === 'hint' ? 'Remember it' : 'Fun fact'}
              onClick={(e) => {
                e.stopPropagation()
                setExtra(null)
              }}
              className={`pop-in absolute inset-0 flex flex-col overflow-y-auto rounded-[12px] bg-surface text-left ${large ? 'gap-2 p-5' : 'gap-1 p-2'}`}
            >
              <p className={`flex items-center justify-between font-cond text-accent uppercase ${large ? 'text-lg' : 'text-xs'}`}>
                <span className="flex items-center gap-1.5">
                  <Icon name={shownExtra === 'hint' ? 'hint' : 'fact'} />
                  {shownExtra === 'hint' ? 'Remember it' : 'Fun fact'}
                </span>
                <Icon name="close" className="text-muted" />
              </p>
              <p className={`leading-snug ${large ? 'text-lg' : 'text-xs'}`}>{shownExtra === 'hint' ? country.hint : country.funFact}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ExtraIcon({ icon, label, large, onOpen }: { icon: IconName; label: string; large: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation()
        onOpen()
      }}
      className={`grid place-items-center rounded-[var(--radius-ui)] border border-line bg-surface leading-none text-accent active:scale-90 ${large ? 'h-9 w-9 text-lg' : 'h-6 w-6 text-xs'}`}
    >
      <Icon name={icon} />
    </button>
  )
}
