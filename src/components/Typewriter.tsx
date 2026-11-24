import { useEffect, useState } from 'react'

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Types text out one character at a time, like a terminal, then leaves a blinking cursor.
 * Remount (change `key`) to replay. Screen readers get the full text straight away.
 */
export function Typewriter({ text, speed = 22, cursor = true }: { text: string; speed?: number; cursor?: boolean }) {
  // Step through whole characters so emoji are never split in half
  const chars = Array.from(text)
  const [shown, setShown] = useState(() => (reducedMotion() ? chars.length : 0))

  useEffect(() => {
    if (shown >= chars.length) return
    const id = setTimeout(() => setShown((n) => n + 1), speed)
    return () => clearTimeout(id)
  }, [shown, chars.length, speed])

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden className={cursor ? 'cursor' : undefined}>
        {chars.slice(0, shown).join('')}
      </span>
    </>
  )
}
