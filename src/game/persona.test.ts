import { describe, expect, it } from 'vitest'
import { countryByCode } from './engine'
import { ALL_LINES, pick, resultLine, rightLine, typeItForgiven, wrongLine } from './persona'

const c = (code: string) => countryByCode(code)!

describe('Moonpie persona', () => {
  it('follows the style rules: under 140 characters, no emojis, no show catchphrases', () => {
    for (const l of ALL_LINES) {
      expect(l.length, l).toBeLessThanOrEqual(140)
      expect(l, l).not.toMatch(/\p{Extended_Pictographic}/u)
      expect(l.toLowerCase(), l).not.toContain('bazinga')
    }
  })

  it('never says the same line twice in a row', () => {
    const makers = [
      () => rightLine(1),
      () => wrongLine({ answer: c('FR'), flagMode: true, wrongStreak: 1 }),
      () => resultLine('meh'),
    ]
    for (const make of makers) {
      let prev = ''
      for (let i = 0; i < 200; i++) {
        const line = make()
        expect(line).not.toBe(prev)
        prev = line
      }
    }
  })

  it('reacts to streaks of exactly two and five', () => {
    expect(rightLine(2)).toMatch(/^Two in a row/)
    expect(rightLine(5)).toMatch(/^Five in a row/)
  })

  it('calls out a look-alike flag when you pick one', () => {
    // Chad and Romania are look-alikes
    for (let i = 0; i < 20; i++) {
      const l = wrongLine({ answer: c('TD'), chosen: c('RO'), flagMode: true, wrongStreak: 1 })
      expect(l).toMatch(/confusable flag|Look-alike flags/)
    }
  })

  it('keeps flag jokes out of the Capitals quiz', () => {
    for (let i = 0; i < 200; i++) {
      expect(rightLine(1, false)).not.toContain('flag')
      const w = wrongLine({ answer: c('FR'), chosen: c('DE'), flagMode: false, wrongStreak: 1 })
      expect(w).not.toMatch(/flag|stripes|red, white, and blue/i)
    }
  })

  it('adds the full country name when Type It forgives a typo or part of a name', () => {
    expect(typeItForgiven('Bosnia and Herzegovina')).toMatch(/Full name: Bosnia and Herzegovina\.$/)
  })

  it('pick works on single-line pools', () => {
    expect(pick(['only'])).toBe('only')
    expect(pick(['only'])).toBe('only')
  })
})
