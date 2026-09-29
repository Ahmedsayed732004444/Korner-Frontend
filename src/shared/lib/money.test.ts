import { describe, expect, it } from 'vitest'
import { formatPiasters, parsePounds, piastersToPounds } from './money'

// Intl uses non-breaking spaces and locale digits, so the checks look at the digits and the amount only.
const digits = (text: string) => text.replace(/[^\d.,٠-٩٫٬]/g, '')

describe('formatPiasters', () => {
  it('shows whole pounds without decimals', () => {
    expect(digits(formatPiasters(15_000, 'en'))).toBe('150')
  })

  it('keeps piasters when there are any', () => {
    expect(digits(formatPiasters(12_550, 'en'))).toBe('125.50')
  })

  it('groups thousands', () => {
    expect(digits(formatPiasters(129_900, 'en'))).toBe('1,299')
  })

  it('writes Arabic digits in Arabic', () => {
    expect(formatPiasters(15_000, 'ar')).toMatch(/[٠-٩]/)
  })

  it('never rounds a total through floating point', () => {
    expect(digits(formatPiasters(1_999, 'en'))).toBe('19.99')
  })
})

describe('parsePounds', () => {
  it.each([
    ['150', 15_000],
    ['149.5', 14_950],
    ['149.50', 14_950],
    ['0.05', 5],
    ['١٤٩٫٥', 14_950],
    [' 20 ', 2_000],
  ])('reads %s', (text, piasters) => {
    expect(parsePounds(text)).toBe(piasters)
  })

  it.each(['', 'abc', '-5', '1.234', '1.2.3'])('rejects %s', (text) => {
    expect(parsePounds(text)).toBeNull()
  })
})

describe('piastersToPounds', () => {
  it('round-trips the amount', () => {
    for (const piasters of [0, 5, 100, 14_950, 129_900, 10_001]) {
      expect(parsePounds(piastersToPounds(piasters))).toBe(piasters)
    }
  })
})
