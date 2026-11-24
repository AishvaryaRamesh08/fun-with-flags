import type { Country } from '../data/types'

const BASE = import.meta.env.BASE_URL

interface Props {
  country: Country
  /** Hide the name from screen readers when it would give the answer away */
  revealName?: boolean
  /** 'hero' = the big question flag; 'thumb' = flags inside tiles and lists */
  variant?: 'hero' | 'thumb'
}

/** Every flag is shown in the same 4:3 frame so cards line up everywhere */
export function Flag({ country, revealName = false, variant = 'hero' }: Props) {
  return (
    <img
      src={`${BASE}${country.flag}`}
      alt={revealName ? `Flag of ${country.name}` : 'Mystery flag'}
      draggable={false}
      className={`block aspect-[4/3] w-full bg-white object-cover select-none ${
        variant === 'hero' ? 'rounded-[10px] ring-2 ring-line' : 'rounded-[8px] ring-1 ring-line'
      }`}
    />
  )
}
