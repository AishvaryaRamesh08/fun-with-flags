import { useCallback, useEffect, useState } from 'react'
import type { Country } from './data/types'
import type { GameSettings, Mode } from './game/types'
import { Flashcards } from './screens/Flashcards'
import { Home } from './screens/Home'
import { Play, type GameResult } from './screens/Play'
import { Results } from './screens/Results'
import { Setup } from './screens/Setup'
import { Stats } from './screens/Stats'
import { TypeGrid } from './screens/TypeGrid'

export type Screen =
  | { name: 'home' }
  | { name: 'setup'; mode: Mode }
  | { name: 'play'; settings: GameSettings; round: number }
  | { name: 'results'; result: GameResult }
  | { name: 'flashcards'; reviewOnly?: boolean; only?: Country[] }
  | { name: 'stats' }

export type Navigate = (screen: Screen) => void

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  // Phone back button / swipe-back returns to the home screen instead of leaving the site
  useEffect(() => {
    const onPop = () => setScreen({ name: 'home' })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback<Navigate>((next) => {
    if (next.name === 'home') {
      if (history.state?.inGame) history.back()
      else setScreen(next)
      return
    }
    if (!history.state?.inGame) history.pushState({ inGame: true }, '')
    setScreen(next)
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 pt-[max(env(safe-area-inset-top),12px)] pb-[max(env(safe-area-inset-bottom),16px)]">
      {screen.name === 'home' && <Home navigate={navigate} />}
      {screen.name === 'setup' && <Setup key={screen.mode} initialMode={screen.mode} navigate={navigate} />}
      {screen.name === 'play' &&
        (screen.settings.mode === 'type-it' ? (
          <TypeGrid key={screen.round} settings={screen.settings} navigate={navigate} />
        ) : (
          <Play key={screen.round} settings={screen.settings} navigate={navigate} />
        ))}
      {screen.name === 'results' && <Results result={screen.result} navigate={navigate} />}
      {screen.name === 'flashcards' && <Flashcards reviewOnly={screen.reviewOnly} only={screen.only} navigate={navigate} />}
      {screen.name === 'stats' && <Stats navigate={navigate} />}
    </div>
  )
}
