import countries from './data/countries.json'

export default function App() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-4 p-6 text-center">
      <div className="text-7xl" aria-hidden>🐼</div>
      <h1 className="text-3xl font-extrabold text-green-700">Fun with Flags</h1>
      <p className="text-slate-600">
        Coming soon — {countries.length} countries loaded and ready to play!
      </p>
    </main>
  )
}
