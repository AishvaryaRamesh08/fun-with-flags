import { useMemo } from 'react'

const BITS = ['🎉', '⭐', '🎊', '🐼', '🎋', '✨']

/** Emoji confetti that falls once. Remount (change `key`) to replay. */
export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: BITS[i % BITS.length],
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.4,
        size: 16 + Math.random() * 18,
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece absolute -top-10"
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, fontSize: p.size }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}
