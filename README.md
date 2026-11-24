# 🐼 Fun with Flags

An ad-free, mobile-first flag quiz game with a retro terminal look and Dr. Pennant, a smug paper cut-out flag expert.
Learn all 195 countries' flags, capitals and currencies — offline, no login, no tracking.

**Play:** https://aishvaryaramesh08.github.io/fun-with-flags/

## Phase 1 (in progress)
- Flag → Country and Country → Flag multiple choice
- Type It: every flag on one page, A–Z or random, no timer, forgiving spelling
- 60-second Blitz
- Flashcards (flag on front; name, capital, currency, hint and fun fact on back)
- Filters for every mode: continent, difficulty (Easy / Medium / Hard), number of questions
- Mistakes feed a Review deck
- Installable on your phone, works offline

## Phase 2 (later)
Tap-the-map, multiplayer, currency quiz.

## Country database
`src/data/countries.json` is generated — don't edit it by hand.

| File | What it holds |
|---|---|
| `data/raw/countries.json` | Snapshot of the open [mledoze/countries](https://github.com/mledoze/countries) dataset |
| `data/curated/<region>.json` | Hand-written difficulty tier, flag hint and fun fact for every country |
| `data/curated/overrides.json` | Name, alias, capital and currency fixes |
| `data/curated/confusables.json` | Look-alike flag groups used for Hard mode |

Flags are SVGs from [flag-icons](https://github.com/lipis/flag-icons), copied to `public/flags/`.
UI icons are from [Pixelarticons](https://github.com/halfmage/pixelarticons) (MIT).

```bash
npm run data:build     # regenerate countries.json + flags
npm run data:validate  # check every country is complete
```

Spotted a wrong hint or fact? Edit the region file and open a pull request.

## Development
```bash
npm install
npm run dev
npm test
```

Every push to `main` is checked and deployed to GitHub Pages automatically.
