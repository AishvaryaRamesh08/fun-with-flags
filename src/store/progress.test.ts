import { describe, expect, it } from 'vitest'
import { DEFAULT_PACE, PACES, answerPauseMs, getProgress, type Progress } from './progress'

const withPace = (pace?: Progress['settings']['pace']): Progress => ({ ...getProgress(), settings: { sound: true, vibration: true, pace } })

describe('answer pause (Settings → Next question after)', () => {
  it('uses the chosen pace for quizzes', () => {
    expect(answerPauseMs(true, false, withPace('fast'))).toBe(PACES.fast.right)
    expect(answerPauseMs(false, false, withPace('relaxed'))).toBe(PACES.relaxed.wrong)
  })
  it('defaults to Quick for players who never chose (older saved progress has no pace)', () => {
    expect(DEFAULT_PACE).toBe('quick')
    expect(answerPauseMs(true, false, withPace(undefined))).toBe(PACES.quick.right)
  })
  it('is about half as long in Blitz, with a sensible minimum', () => {
    expect(answerPauseMs(true, true, withPace('steady'))).toBe(700)
    expect(answerPauseMs(true, true, withPace('fast'))).toBe(350)
    expect(answerPauseMs(false, true, withPace('fast'))).toBe(700)
  })
  it('gets longer with each step from Fast to Relaxed', () => {
    const order = Object.values(PACES)
    for (let i = 1; i < order.length; i++) {
      expect(order[i].right).toBeGreaterThan(order[i - 1].right)
      expect(order[i].wrong).toBeGreaterThan(order[i - 1].wrong)
    }
  })
})
