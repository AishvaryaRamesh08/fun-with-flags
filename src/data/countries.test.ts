import { describe, expect, it } from 'vitest'
import countries from './countries.json'
import type { Country } from './types'

const all = countries as Country[]
const byCode = Object.fromEntries(all.map((c) => [c.code, c]))

describe('country database', () => {
  it('has the 195 countries and no territories', () => {
    expect(all).toHaveLength(195)
    for (const territory of ['PR', 'GL', 'HK', 'TW', 'XK']) expect(byCode[territory]).toBeUndefined()
  })

  it('includes Vatican City and Palestine', () => {
    expect(byCode.VA.name).toBe('Vatican City')
    expect(byCode.PS.name).toBe('Palestine')
  })

  it('accepts common alternative names', () => {
    expect(byCode.TR.aliases).toContain('Turkey')
    expect(byCode.CZ.aliases).toContain('Czech Republic')
    expect(byCode.CI.aliases).toContain("Côte d'Ivoire")
  })

  it('links look-alike flags both ways', () => {
    expect(byCode.TD.confusableWith).toContain('RO')
    expect(byCode.RO.confusableWith).toContain('TD')
  })
})
