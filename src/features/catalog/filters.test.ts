import { describe, expect, it } from 'vitest'
import { activeFilterCount, clearFilters, emptyListing, pageSize, parseListing, toProductParams, writeListing } from './filters'

const parse = (query: string) => parseListing(new URLSearchParams(query))

describe('parseListing', () => {
  it('gives the defaults for a bare address', () => {
    expect(parse('')).toEqual(emptyListing)
  })

  it('reads every filter from the address', () => {
    const state = parse('sort=priceAsc&colors=a,b&sizes=M,42&brands=x&min=200&max=900&available=1&sale=1&page=3')

    expect(state).toEqual({
      sort: 'priceAsc',
      colors: ['a', 'b'],
      sizes: ['M', '42'],
      brands: ['x'],
      minPrice: 200,
      maxPrice: 900,
      availableOnly: true,
      onSaleOnly: true,
      page: 3,
    })
  })

  it('ignores anything malformed instead of failing', () => {
    const state = parse('sort=DROP%20TABLE&page=-3&min=abc&max=1e9&available=yes&colors=,,')

    expect(state).toEqual(emptyListing)
  })

  it('swaps a minimum that is above the maximum', () => {
    expect(parse('min=900&max=200')).toMatchObject({ minPrice: 200, maxPrice: 900 })
  })
})

describe('writeListing', () => {
  it('leaves defaults out so addresses stay short', () => {
    expect(writeListing(emptyListing).toString()).toBe('')
  })

  it('round-trips a full state', () => {
    const state = parse('sort=bestSellers&colors=a&sizes=M,L&min=100&available=1&page=2')

    expect(parse(writeListing(state).toString())).toEqual(state)
  })

  it('keeps unrelated parameters such as the search text', () => {
    const written = writeListing({ ...emptyListing, colors: ['a'] }, new URLSearchParams('q=bag&sort=priceAsc&page=4'))

    expect(written.get('q')).toBe('bag')
    expect(written.get('colors')).toBe('a')
    expect(written.has('sort')).toBe(false)
    expect(written.has('page')).toBe(false)
  })
})

describe('activeFilterCount and clearFilters', () => {
  it('counts each choice and the price range once, but not sort or page', () => {
    expect(activeFilterCount({ ...emptyListing, sort: 'priceDesc', page: 5 })).toBe(0)
    expect(activeFilterCount(parse('colors=a,b&sizes=M&min=1&max=2&available=1'))).toBe(5)
  })

  it('clears filters but keeps the chosen sort', () => {
    expect(clearFilters(parse('sort=priceAsc&colors=a&page=3'))).toEqual({ ...emptyListing, sort: 'priceAsc' })
  })
})

describe('toProductParams', () => {
  it('turns pounds into the piasters the API expects, and adds the sort order', () => {
    const params = toProductParams(parse('sort=priceDesc&min=500&max=1000&page=2'), { category: 'shoes' })

    expect(params).toMatchObject({ category: 'shoes', sort: '-price', minPricePiasters: 50_000, maxPricePiasters: 100_000, pageNumber: 2, pageSize })
  })

  it('sends no price limit when none is set', () => {
    const params = toProductParams(emptyListing, {})

    expect(params.minPricePiasters).toBeUndefined()
    expect(params.maxPricePiasters).toBeUndefined()
  })
})
