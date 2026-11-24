import type { ReactNode } from 'react'

export function TopBar({ title, onBack, right }: { title?: ReactNode; onBack: () => void; right?: ReactNode }) {
  return (
    <header className="mb-3 flex min-h-12 items-center gap-3">
      <button
        onClick={onBack}
        aria-label="Back"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border-[3px] border-ink bg-white text-xl font-black shadow-[0_3px_0_var(--color-ink)] active:translate-y-[3px] active:shadow-none"
      >
        ←
      </button>
      <h1 className="flex-1 truncate text-xl font-extrabold">{title}</h1>
      {right}
    </header>
  )
}
