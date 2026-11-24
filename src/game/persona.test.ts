import { describe, expect, it } from 'vitest'
import { MOOD_LINES, pick, resultLine, rightLine, streakLine, wrongLine } from './persona'

describe('Moonpie persona', () => {
  it('never says the same line twice in a row', () => {
    for (const make of [rightLine, () => wrongLine('India'), () => streakLine(5), () => resultLine('meh')]) {
      let prev = ''
      for (let i = 0; i < 200; i++) {
        const line = make()
        expect(line).not.toBe(prev)
        prev = line
      }
    }
  })

  it('uses plenty of different wrong-answer lines and always names the right answer', () => {
    const seen = new Set(Array.from({ length: 400 }, () => wrongLine('India')))
    expect(seen.size).toBeGreaterThanOrEqual(15)
    for (const l of seen) expect(l).toContain('India')
  })

  it('keeps correct-answer lines short enough to read in the 0.6s before the next question', () => {
    for (const l of MOOD_LINES.smug) expect(l.length).toBeLessThanOrEqual(30)
  })

  it('pick works on single-line pools', () => {
    expect(pick(['only'])).toBe('only')
    expect(pick(['only'])).toBe('only')
  })
})
