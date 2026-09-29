import { describe, expect, it } from 'vitest'
import { formatPiasters } from './money'

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
