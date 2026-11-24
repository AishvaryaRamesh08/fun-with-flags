import type { Country } from '../data/types'

const BASE = import.meta.env.BASE_URL

interface Props {
  country: Country
  /** Hide the name from screen readers when it would give the answer away */
  revealName?: boolean
  /** 'hero' = big framed flag; 'thumb' = small flag in lists and option buttons */
  variant?: 'hero' | 'thumb'
}

export function Flag({ country, revealName = false, variant = 'hero' }: Props) {
  const style =
    variant === 'hero'
      ? 'rounded-xl border-[3px] shadow-[4px_4px_0_var(--color-ink)]'
      : 'rounded-lg border-2'
  return (
    <img
      src={`${BASE}${country.flag}`}
      alt={revealName ? `Flag of ${country.name}` : 'Mystery flag'}
      draggable={false}
      className={`aspect-[4/3] w-full border-ink bg-white object-cover select-none ${style}`}
    />
  )
}
