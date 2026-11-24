import type { ReactNode } from 'react'

export function TopBar({ title, onBack, right }: { title?: ReactNode; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="mb-4 flex min-h-12 items-center gap-3">
      <button onClick={onBack} aria-label="Back" className="icon-btn">
        ←
      </button>
      <h1 className="display flex-1 truncate text-2xl">{title}</h1>
      {right}
    </header>
  )
}
