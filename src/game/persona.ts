/**
 * Moonpie's voice: a self-declared genius who believes he is the smartest person alive.
 * Rude, smug and sarcastic, and he never gives a real compliment: right answers get
 * backhanded remarks, wrong answers get theatrical disappointment. Every line is original.
 *
 * pick() never returns the same line twice in a row from the same pool, so he doesn't
 * repeat himself. Lines appear instantly; keep them short enough to read at a glance.
 */

const lastPicked = new Map<readonly string[], string>()

export function pick(pool: readonly string[]): string {
  const prev = lastPicked.get(pool)
  const options = pool.length > 1 ? pool.filter((l) => l !== prev) : pool
  const line = options[Math.floor(Math.random() * options.length)]
  lastPicked.set(pool, line)
  return line
}

/** After a correct answer (on screen for ~0.6s). Never a compliment. Keep under ~30 characters. */
const RIGHT = [
  'Lucky guess.',
  'Even a broken clock…',
  'Correct. Don’t get cocky.',
  'Fine. That one was easy.',
  'A toddler knew that one.',
  'Statistically inevitable.',
  'Hm. Adequate. Barely.',
  'Right. Moving on.',
  'Correct. Suspicious.',
  'Was that so hard? Apparently.',
  'I’ve seen worse. Not often.',
  'Yes. Try not to faint.',
  'Correct. I’m unmoved.',
  'Congratulations. On nothing.',
  'Even you couldn’t miss that.',
  'Mm. Beginner’s luck.',
] as const

/** After a wrong answer. {a} is the right answer. Keep under ~60 characters. */
const WRONG = [
  '{a}. Fascinating how wrong you were.',
  'No. {a}. I’m embarrassed for both of us.',
  '{a}. I’d explain, but I’m out of crayons.',
  'Wrong. It’s {a}. Try using your brain.',
  '{a}. My goldfish knew that.',
  'Incorrect. {a}. Take notes. Slowly.',
  '{a}. I weep for your education.',
  'That was {a}. You were close. Not really.',
  'No. {a}. Shocking, I know.',
  '{a}. Write it down. Twice.',
  '{a}. My disappointment is immeasurable.',
  'Wrong. {a}. Adding it to your list of failures.',
  '{a}. Did you guess? It looked like a guess.',
  'It’s {a}. I can’t believe I have to say that.',
  '{a}. I’ve met houseplants with better instincts.',
  'Bold choice. Wrong, but bold. It’s {a}.',
  '{a}. Please tell me that was a misclick.',
  'No. {a}. I need to lie down.',
] as const

/** Shown while you think, after 3+ right in a row. {n} is the streak. */
const STREAK = [
  '{n} in a row. Still not impressed.',
  '{n} straight. The odds caught up with you.',
  '{n} in a row? I suspect cheating.',
  '{n}. I did all 195 blindfolded. Age six.',
  '{n} correct. Don’t let it go to your head.',
  '{n}. Even a stopped clock gets a streak.',
] as const

export const rightLine = () => pick(RIGHT)
export const wrongLine = (answer: string) => pick(WRONG).replace('{a}', answer)
export const streakLine = (n: number) => pick(STREAK).replace('{n}', String(n))

/** End-of-round verdicts. Even a perfect score gets no praise. */
const RESULT = {
  perfect: [
    'Perfect score. The questions were clearly too easy.',
    'Flawless. I’ll be filing a complaint about the difficulty.',
    'All correct. Don’t expect a parade.',
  ],
  good: [
    'Adequate. I’d have scored higher asleep.',
    'Not terrible. Not good, either.',
    'Passable. I’ve set the bar low for you. You cleared it.',
  ],
  meh: [
    'Mediocre. For you, that might be a personal best.',
    'Half right. Half the battle. Half a brain.',
    'I’ve seen worse. Mostly from you.',
  ],
  bad: [
    'That was painful to watch. Flashcards. Now.',
    'A random number generator would have beaten you.',
    'I need a moment. That was a lot of wrong.',
  ],
} as const
export type ResultTier = keyof typeof RESULT
export const resultTier = (pct: number): ResultTier => (pct === 100 ? 'perfect' : pct >= 70 ? 'good' : pct >= 40 ? 'meh' : 'bad')
export const resultLine = (tier: ResultTier) => pick(RESULT[tier])
/** His face for each verdict: never pleased. A perfect score gets an eye-roll ("too easy"). */
export const RESULT_MOOD = { perfect: 'eyeroll', good: 'smug', meh: 'eyeroll', bad: 'facepalm' } as const

/** Default lines for each mood when a screen doesn't pass its own */
export const MOOD_LINES = {
  idle: [
    'Vexillology: the study of flags. You wouldn’t know.',
    'I’m Moonpie. You may admire me from there.',
    'My IQ can’t be measured. People have tried.',
  ],
  wave: [
    'Oh. It’s you again.',
    'Welcome back. Lower your expectations accordingly.',
    'I’ve been alphabetising my flags. You’re interrupting.',
    'Ah, my least gifted student.',
  ],
  thinking: [
    'Take your time. I’ll just stand here, being right.',
    'Hint: the answer is the correct one.',
    'Any decade now.',
  ],
  smug: RIGHT,
  eyeroll: ['Oh, how thrilling for you.', 'Wake me when it gets difficult.', 'Yes, yes. Very impressive. Not.'],
  facepalm: ['No.', 'Wrong.', 'I can’t watch.'],
} as const

/** Type It page */
export const TYPE_IT = {
  intro: 'Name every flag. I’ll be judging. Silently. Mostly.',
  solved: [
    '{d} down. Don’t expect applause.',
    '{d} named. {r} to go. Try to keep up.',
    '{d}. A snail would be proud. I’m not.',
    'Fine. {r} left. I’m aging over here.',
  ],
  wrong: ['No. Look again. Properly.', 'Wrong. Use your eyes this time.', 'That’s not it. Clearly.', 'Nope. Try thinking first.'],
  gaveUp: ['Giving up? Predictable.', 'Surrender accepted. Study these.', 'I knew you’d quit. I always know.'],
  typo: 'I’ll allow it. The full name is “{a}”. Precision exists, you know.',
}
export const typeItSolved = (done: number, left: number) => pick(TYPE_IT.solved).replace('{d}', String(done)).replace('{r}', String(left))
