// Pixel-grid icons from Pixelarticons (MIT, github.com/halfmage/pixelarticons).
// They draw in currentColor, so they always match the active theme.
import type { CSSProperties } from 'react'
import i_back from 'pixelarticons/svg/arrow-left.svg?raw'
import i_close from 'pixelarticons/svg/close.svg?raw'
import i_check from 'pixelarticons/svg/check.svg?raw'
import i_hint from 'pixelarticons/svg/lightbulb.svg?raw'
import i_fact from 'pixelarticons/svg/info-box.svg?raw'
import i_sort from 'pixelarticons/svg/sort-vertical.svg?raw'
import i_shuffle from 'pixelarticons/svg/shuffle.svg?raw'
import i_restart from 'pixelarticons/svg/reload.svg?raw'
import i_finish from 'pixelarticons/svg/flag.svg?raw'
import i_card from 'pixelarticons/svg/card-text.svg?raw'
import i_review from 'pixelarticons/svg/repeat.svg?raw'
import i_grid from 'pixelarticons/svg/grid-3x3.svg?raw'
import i_earth from 'pixelarticons/svg/earth.svg?raw'
import i_star from 'pixelarticons/svg/star.svg?raw'
import i_down from 'pixelarticons/svg/thumbs-down.svg?raw'
import i_up from 'pixelarticons/svg/thumbs-up.svg?raw'
import i_prev from 'pixelarticons/svg/chevron-left.svg?raw'
import i_next from 'pixelarticons/svg/chevron-right.svg?raw'
import i_fire from 'pixelarticons/svg/fire.svg?raw'
import i_stats from 'pixelarticons/svg/chart.svg?raw'
import i_zap from 'pixelarticons/svg/zap.svg?raw'
import i_trophy from 'pixelarticons/svg/trophy.svg?raw'
import i_home from 'pixelarticons/svg/home.svg?raw'
import i_settings from 'pixelarticons/svg/sliders.svg?raw'
import i_sound from 'pixelarticons/svg/volume-3.svg?raw'
import i_vibrate from 'pixelarticons/svg/vibrate.svg?raw'
import i_trash from 'pixelarticons/svg/trash.svg?raw'
import i_flag from 'pixelarticons/svg/flag.svg?raw'
import i_search from 'pixelarticons/svg/search.svg?raw'
import i_keyboard from 'pixelarticons/svg/keyboard.svg?raw'
import i_capital from 'pixelarticons/svg/building.svg?raw'
import i_play from 'pixelarticons/svg/play.svg?raw'
import i_eye from 'pixelarticons/svg/eye-off.svg?raw'

const ICONS = {
  back: i_back,
  close: i_close,
  check: i_check,
  hint: i_hint,
  fact: i_fact,
  sort: i_sort,
  shuffle: i_shuffle,
  restart: i_restart,
  finish: i_finish,
  card: i_card,
  review: i_review,
  grid: i_grid,
  earth: i_earth,
  star: i_star,
  down: i_down,
  up: i_up,
  prev: i_prev,
  next: i_next,
  fire: i_fire,
  stats: i_stats,
  zap: i_zap,
  trophy: i_trophy,
  home: i_home,
  settings: i_settings,
  sound: i_sound,
  vibrate: i_vibrate,
  trash: i_trash,
  flag: i_flag,
  search: i_search,
  keyboard: i_keyboard,
  capital: i_capital,
  play: i_play,
  eye: i_eye,
} as const

export type IconName = keyof typeof ICONS

interface Props {
  name: IconName
  /** Give a label only when the icon is the sole content of a button; otherwise it's decorative */
  label?: string
  className?: string
  style?: CSSProperties
}

/** A small pixel icon, sized to the surrounding text (1.1em) */
export function Icon({ name, label, className = '', style }: Props) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block h-[1.1em] w-[1.1em] shrink-0 align-[-0.15em] [&>svg]:h-full [&>svg]:w-full ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  )
}
