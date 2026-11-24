export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania'

export const CONTINENTS: Continent[] = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania']

/** 1 = well known (Easy), 2 = medium, 3 = obscure (Hard only) */
export type Tier = 1 | 2 | 3

export interface Country {
  /** ISO 3166-1 alpha-2, e.g. "JO" */
  code: string
  name: string
  officialName: string
  /** Other accepted answers when typing, e.g. "Turkey" for Türkiye */
  aliases: string[]
  /** All capitals, primary first */
  capitals: string[]
  capitalNote?: string
  currency: { code: string; name: string; symbol: string }
  continent: Continent
  subregion: string
  latlng: [number, number]
  /** Path relative to the site base, e.g. "flags/jo.svg" */
  flag: string
  tier: Tier
  /** What makes this flag unique — shown after a mistake and on flashcards */
  hint: string
  funFact: string
  /** Codes of look-alike flags, used for Hard-mode wrong answers */
  confusableWith: string[]
}
