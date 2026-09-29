import { describe, expect, it } from 'vitest'
import { asUtc, fromDateTimeLocal, toDateTimeLocal } from './dates'

describe('asUtc', () => {
  it('treats API times without a zone as UTC', () => {
    expect(asUtc('2026-09-29T10:00:00').toISOString()).toBe('2026-09-29T10:00:00.000Z')
    expect(asUtc('2026-09-29T10:00:00Z').toISOString()).toBe('2026-09-29T10:00:00.000Z')
  })
})

describe('datetime-local conversion', () => {
  it('round-trips to the same moment, whatever the time zone', () => {
    const iso = '2026-09-29T10:30:00.000Z'
    expect(fromDateTimeLocal(toDateTimeLocal(iso))).toBe(iso)
  })

  it('handles empty values', () => {
    expect(toDateTimeLocal(null)).toBe('')
    expect(fromDateTimeLocal('')).toBeNull()
    expect(fromDateTimeLocal('not a date')).toBeNull()
  })
})
