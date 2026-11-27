import type { Country } from '../data/types'

/**
 * Moonpie — the mascot of Fun with Flags.
 *
 * A smug, retro-terminal paper cut-out who acts like a pedantic vexillology and geography genius
 * (a Sheldon-style personality, without the show's catchphrases):
 * - Superiority & pedantry: flags, capitals, currencies and borders are sacred academic truths.
 * - Zero compliments: even a perfect score is the bare minimum for a functioning brain.
 * - Literal & over-specific: corrects confusable flags and careless spelling with clinical precision.
 * - Routine & order: loves neat categories and clean data; ruffled by chaos, timers and sloppiness.
 * - Dry deadpan: calm, matter-of-fact condescension. No yelling, no emojis.
 * Tone by context: welcoming-yet-condescending at the start, smug on streaks, clinical on mistakes,
 * impatient in Blitz, brisk on Flashcards and Review. Lines stay under 140 characters.
 *
 * pick() never returns the same line twice in a row from the same pool.
 */

const lastPicked = new Map<readonly string[], string>()

export function pick(pool: readonly string[]): string {
  const prev = lastPicked.get(pool)
  const options = pool.length > 1 ? pool.filter((l) => l !== prev) : pool
  const line = options[Math.floor(Math.random() * options.length)]
  lastPicked.set(pool, line)
  return line
}
const chance = (p: number) => Math.random() < p

// ---------------------------------------------------------------- Greeting & session start

export const FIRST_VISIT = 'Welcome to Fun with Flags. I’ve already mapped out your disappointment.'

const GREETING = [
  FIRST_VISIT,
  '195 flags. I know them all. You have… enthusiasm, I suppose.',
  'Pull up a chair. Preferably the third one from the left. Never the second.',
  'No ads, no tracking, and zero mercy for guesswork.',
  'A two-dimensional paper cut-out is about to out-think you. Try to stay calm.',
  'Ah, starting a session. Nothing says “intellectual rigor” like clicking buttons and hoping.',
  'Let’s begin. Remember: sarcasm is a defense mechanism, and right now you need one.',
  'Ready? Good. I’ve cleared my schedule of nothing to watch this.',
  'One hundred ninety-five countries. Statistically, you should get at least three right by accident.',
  'I brought structure, accuracy, and superiority. You brought… whatever that is.',
  'The retro terminal hums. Your brain, tentatively, follows.',
] as const

// ---------------------------------------------------------------- Correct answers & streaks

const RIGHT = [
  'Correct. I’d say something triumphant, but I have dignity.',
  'Right. Clearly, your brain borrowed a smart cell for that one.',
  'You got it! I’m stunned. Actually, no, I just lowered my bar to sea level.',
  'Correct. Even a pigeon pecking buttons gets lucky occasionally.',
  'You knew that. I’m writing it down under “Things That Should Not Surprise Me.”',
  'Correct. Quick—lock it in a vault before it escapes.',
  'Spot on. A modest victory for mammal-kind.',
  'Correct. Your neurons are finally holding hands and walking in the same direction.',
  'You matched the flag! Shall I alert the Nobel committee or just sigh?',
  'Correct. That was almost as smooth as my Tuesday routine.',
  'Right. Proceed immediately to acting normal.',
  'You didn’t guess! Look at you, acting like someone who reads.',
  'Correct. I’d clap, but paper cut-outs lack elbows.',
] as const

/** Right answers outside the flag modes (Capitals): no flag references */
const RIGHT_NO_FLAG = RIGHT.filter((l) => !l.includes('flag'))

const STREAK = [
  'A streak! Let me note this on a chalkboard so I can erase it later.',
  'Another right answer. Don’t worry, I won’t let it go to your head—there’s plenty of room.',
  'Streak alive. Try not to celebrate by licking a battery.',
] as const
const STREAK_TWO = 'Two in a row. Careful, too much success might give you a personality.'
const STREAK_FIVE = 'Five in a row. Still not a PhD in vexillology, but cute effort.'

/** After a correct answer; `streak` is the run including this answer */
export function rightLine(streak: number, flagMode = true): string {
  if (streak === 2) return STREAK_TWO
  if (streak === 5) return STREAK_FIVE
  if (streak >= 3 && chance(0.4)) return pick(STREAK)
  return pick(flagMode ? RIGHT : RIGHT_NO_FLAG)
}

// ---------------------------------------------------------------- Wrong answers & confusables

const WRONG = [
  'Wrong. That wasn’t a guess; that was a cry for help.',
  'No. I’ve seen better cartography drawn with crayons on a napkin.',
  'Incorrect. Close only counts in horseshoes, hand grenades, and—well, mostly those two.',
  'No. Even my theoretical roommate would have cringed at that.',
  'Wrong. Bold, theatrical, and completely detached from reality.',
  'Incorrect. Let’s pause for a moment of silence for the atlas you ignored.',
  'Wrong. That wasn’t a slip of the finger; that was a slip of the curriculum.',
  'Incorrect. Fascinating. You invented a brand-new country just now.',
  'Wrong. If ignorance were a currency, you could buy a small island—probably the wrong one.',
  'Incorrect. You had a one-in-four shot and somehow found a fifth, wronger option.',
  'No. Don’t look at me like that; I didn’t make the world complicated.',
  'Incorrect. I’m adding this to my chart of “Humanity’s Quirks.”',
  'No. We’ll put that in the Review deck, right next to your excuses.',
  'Wrong. Precision is a virtue; you appear to be practicing a different religion.',
] as const
/** Only make sense when the question is about flags */
const WRONG_FLAG_ONLY = [
  'Wrong. You picked a flag purely because you liked its vibe. Its vibe is “incorrect.”',
  'No. Red, white, and blue do not all belong to the same team. Shocking, I know.',
  'No. Stripes don’t just mean “decorative lines,” despite your theory.',
] as const
const WRONG_WITH_FLAGS = [...WRONG, ...WRONG_FLAG_ONLY]
/** You picked a look-alike flag */
const WRONG_CONFUSABLE = [
  'A confusable flag! It’s like identical twins, except one actually has a passport.',
  'No. Look-alike flags exist specifically to punish overconfidence. Enjoy your punishment.',
] as const
const WRONG_SAME_CONTINENT = 'Wrong. Same continent, wrong nation. Like ordering soup and getting a trombone.'
const WRONG_OTHER_CONTINENT = 'Incorrect. That country isn’t even on the right side of the planet, let alone the screen.'
const WRONG_AGAIN = 'Wrong again. At this point, you’re practically conducting a study in error.'
const BLITZ_WRONG = 'Speeding through wrong answers is still just being wrong, faster.'

export interface WrongContext {
  answer: Country
  /** The option you picked (multiple choice) */
  chosen?: Country
  /** Flag questions (Guess the Country, Find the Flag); false for Capitals */
  flagMode: boolean
  /** Wrong answers in a row, including this one */
  wrongStreak: number
  blitz?: boolean
}

/** After a wrong answer: reacts to what you actually picked where it can */
export function wrongLine({ answer, chosen, flagMode, wrongStreak, blitz }: WrongContext): string {
  if (wrongStreak >= 2 && chance(0.4)) return WRONG_AGAIN
  if (blitz && chance(0.3)) return BLITZ_WRONG
  if (flagMode && chosen && answer.confusableWith.includes(chosen.code)) return pick(WRONG_CONFUSABLE)
  if (chosen && chance(0.3)) return chosen.continent === answer.continent ? WRONG_SAME_CONTINENT : WRONG_OTHER_CONTINENT
  return pick(flagMode ? WRONG_WITH_FLAGS : WRONG)
}

// ---------------------------------------------------------------- Type It (typing & spelling)

export const TYPE_IT = {
  intro: 'No timer! Take your time. Maybe consult a scribe.',
  orderAZ: 'Alphabetical order: calming, orderly, soothing. Your typing: a jump scare.',
  orderRandom: 'Random order keeps things lively. Mostly by watching you panic.',
  /** Spelled perfectly */
  clean: [
    'Clean spelling! I’m genuinely unsettled.',
    'Valid entry. My standards remain high enough to require a ladder.',
    ...RIGHT.filter((l) => !l.includes('flag')).slice(0, 6),
  ],
  /** Accepted with a typo or as part of the name; the full name is added after */
  forgiven: [
    'Forgiving spelling is a kindness I only extend because I pity your keyboard.',
    'Accepted. Though the ghost of a dictionary just wept softly.',
    'The parser forgave you. My soul did not.',
  ],
  wrong: [
    'That spelling looks like your cat walked across the keys in protest.',
    'You typed something! It vaguely resembled English, which is a start.',
    'Forgiving spelling doesn’t mean “creative jazz spelling.”',
    'Did you type that with your elbows, or are you just warming up?',
  ],
  gaveUp: [
    'Giving up? Predictable.',
    'Surrender accepted. Study these. Thoroughly.',
    'I knew you’d quit. I always know.',
  ],
}
export const typeItClean = () => pick(TYPE_IT.clean)
export const typeItForgiven = (fullName: string) => `${pick(TYPE_IT.forgiven)} Full name: ${fullName}.`

// ---------------------------------------------------------------- 60-second Blitz

export const BLITZ = {
  start: [
    'Sixty seconds! Please try to panic in an orderly fashion.',
    'The clock is ticking. Screaming at the monitor does not add time.',
    'Fast is good. Accurate is better. Doing both? Let’s not get greedy.',
  ],
  /** 45 seconds left */
  early: ['Hurry! The flag won’t magically label itself out of sympathy.', 'The clock is ticking. Screaming at the monitor does not add time.'],
  /** 30 seconds left */
  half: [
    'Halfway done! Your speed is brisk; your accuracy is taking a scenic detour.',
    'Thirty seconds gone. Even my spot on the couch has more momentum.',
  ],
  /** 10 seconds left */
  end: [
    'Ten seconds left! Channel your inner genius—or at least your inner caffeinated squirrel.',
    'Final countdown! Try not to end on a complete hallucination.',
  ],
  /** Results screen after Blitz */
  over: [
    'Time’s up! Pencils down, pride slightly bruised.',
    'Blitz mode reveals everything. Mostly that you blink too much under pressure.',
    'Sixty seconds over! Reality has arrived, and it brought a spreadsheet.',
  ],
}

// ---------------------------------------------------------------- Flashcards & Review deck

export const FLASHCARDS = {
  study: [
    'Flip the card. Read the capital, currency, and hint. Yes, the words are there for a reason.',
    'Fun facts! A little trivia candy before you go right back to missing them.',
    'Front: flag. Back: facts. Middle: your struggle to remember both.',
    'Hints are clues, not cheat codes—though judging by your score, you need all the help you get.',
    'Check the currency! You can’t buy a pretzel in Europe with monopoly money—or a flag.',
    'Flashcards are a routine. Routines are good. Your recall is… a work in progress.',
    'Try reading the hint before clicking. It’s a radical, experimental technique.',
  ],
  review: [
    'Welcome back to the Review deck—your personal hall of fame for “oops.”',
    'The Review deck misses you. Mostly because you keep coming back.',
    'Missed it once? No problem. Repetition builds character. You’re going to be very characterful.',
    'Every card in Review is a polite reminder that guessing isn’t a strategy.',
  ],
  reviewEmpty: 'Your Review deck is getting smaller! Don’t worry, I’ll find new ways to humble you.',
}

// ---------------------------------------------------------------- Filters, settings & meta

export const SETUP = {
  start: 'Choose your filters. Not that a drop-down menu can fix a trivia tragedy.',
  typeIt: 'No timer! Take your time. Maybe consult a scribe.',
  blitz: 'Sixty seconds! Please try to panic in an orderly fashion.',
  mode: 'Changing modes again? Indecision is not a scientific method.',
  continent: [
    'Filtering by continent helps, much like wearing floaties in a kiddie pool.',
    'Pick a continent and stick with it. Commitment is scary, I know.',
  ],
  difficulty: 'Easy mode: for beginners. Medium: for people who paid half-attention. Hard: for people who like pain.',
  hard: 'Hard mode has look-alike flags. They’re the doppelgängers of vexillology.',
  count: 'Changing the question count won’t change the capital of Kazakhstan. Sorry.',
}

export const STATS = [
  'Ad-free, offline, and no tracking. Your mistakes stay strictly between us and the terminal.',
  'The country database is spotless. Your quiz score, however, needs a mop.',
  'Works offline! Great for flights, subways, and moments when Wi-Fi isn’t to blame.',
] as const

// ---------------------------------------------------------------- Results

const RESULT = {
  perfect: [
    'Perfect score. The questions were clearly too easy.',
    'All correct. That’s the bare minimum for a functioning brain. Don’t expect a parade.',
    'Session over! You survived. I remain thoroughly underwhelmed.',
  ],
  good: [
    'Score tallied. Not bad—if we grade on a curve invented by a generous Labrador.',
    'Session over! You survived. I remain thoroughly underwhelmed.',
    'Adequate. I’d have scored higher asleep.',
  ],
  meh: [
    'Score tallied. Not bad—if we grade on a curve invented by a generous Labrador.',
    'Mediocre. For you, that might be a personal best.',
    'Session over! You survived. I remain thoroughly underwhelmed.',
  ],
  bad: [
    'That was painful to watch. Flashcards. Now.',
    'A random number generator would have beaten you.',
    'Session over! You survived. Your score, regrettably, did not.',
  ],
} as const
export type ResultTier = keyof typeof RESULT
export const resultTier = (pct: number): ResultTier => (pct === 100 ? 'perfect' : pct >= 70 ? 'good' : pct >= 40 ? 'meh' : 'bad')
export const resultLine = (tier: ResultTier, blitz = false) => (blitz && chance(0.5) ? pick(BLITZ.over) : pick(RESULT[tier]))
/** His face for each verdict: never pleased. A perfect score gets an eye-roll ("too easy"). */
export const RESULT_MOOD = { perfect: 'eyeroll', good: 'smug', meh: 'eyeroll', bad: 'facepalm' } as const

// ---------------------------------------------------------------- Default line per mood

export const MOOD_LINES = {
  idle: GREETING,
  wave: GREETING,
  thinking: ['Take your time. I’ll just stand here, being right.', 'Any decade now.'],
  smug: RIGHT,
  eyeroll: ['Oh, how thrilling for you.', 'Wake me when it gets difficult.'],
  facepalm: WRONG,
} as const

/** Every line Moonpie can say (for tests: length and style rules) */
export const ALL_LINES: string[] = [
  ...GREETING, ...RIGHT, ...STREAK, STREAK_TWO, STREAK_FIVE,
  ...WRONG_WITH_FLAGS, ...WRONG_CONFUSABLE, WRONG_SAME_CONTINENT, WRONG_OTHER_CONTINENT, WRONG_AGAIN, BLITZ_WRONG,
  TYPE_IT.intro, TYPE_IT.orderAZ, TYPE_IT.orderRandom, ...TYPE_IT.clean, ...TYPE_IT.forgiven, ...TYPE_IT.wrong, ...TYPE_IT.gaveUp,
  ...Object.values(BLITZ).flat(), ...FLASHCARDS.study, ...FLASHCARDS.review, FLASHCARDS.reviewEmpty,
  SETUP.start, SETUP.mode, ...SETUP.continent, SETUP.difficulty, SETUP.hard, SETUP.count,
  ...STATS, ...Object.values(RESULT).flat(),
]
