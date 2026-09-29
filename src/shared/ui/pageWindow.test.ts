import { describe, expect, it } from 'vitest'
import { pageWindow } from './pageWindow'

describe('pageWindow', () => {
  it('shows a single page as just that page', () => {
    expect(pageWindow(1, 1)).toEqual([1])
  })

  it('shows every page when there are few', () => {
    expect(pageWindow(2, 3)).toEqual([1, 2, 3])
  })

  it('always keeps the first and last page, with gaps where pages are skipped', () => {
    expect(pageWindow(10, 20)).toEqual([1, 'gap', 8, 9, 10, 11, 12, 'gap', 20])
  })

  it('does not put a gap next to an adjacent page', () => {
    expect(pageWindow(3, 8)).toEqual([1, 2, 3, 4, 5, 'gap', 8])
  })

  it('handles the last page', () => {
    expect(pageWindow(20, 20)).toEqual([1, 'gap', 18, 19, 20])
  })
})
