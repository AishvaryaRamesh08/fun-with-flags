import type { ReactNode } from 'react'
import { Typewriter } from './Typewriter'

/** Screen header: back button + a title that types itself out like a terminal command */
export function TopBar({ title, onBack, right }: { title?: ReactNode; onBack: () => void; right?: ReactNode }) {
  const text = typeof title === 'string' ? stripEmoji(title) : null
  const size = text && text.length > 14 ? 'text-[1.4rem]' : 'text-[1.7rem]'
  return (
    <header className="mb-4 flex min-h-12 items-center gap-3">
      <button onClick={onBack} aria-label="Back" className="icon-btn">
        ←
      </button>
      <h1 className={`display min-w-0 flex-1 truncate ${size}`}>
        <span className="text-accent">&gt; </span>
        {text !== null ? <Typewriter key={text} text={text} speed={30} /> : title}
      </h1>
      {right}
    </header>
  )
}

/** Terminal titles are plain text: drop a leading emoji like "🃏 " */
const stripEmoji = (t: string) => t.replace(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\uFE0F?\s*/u, '')
