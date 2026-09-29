import type { ProductListParams } from './api'

export const sortKeys = ['newest', 'bestSellers', 'priceAsc', 'priceDesc'] as const
export type SortKey = (typeof sortKeys)[number]

// The backend's sort syntax: a leading "-" means descending.
const sortOrders: Record<SortKey, string> = {
  newest: '-publishedAt',
  bestSellers: '-salesCount,-publishedAt',
  priceAsc: 'price',
  priceDesc: '-price',
}

export const pageSize = 12

// Everything the shopper can change on a product list. It lives in the page URL, so a link keeps the filters
// and the back button undoes a filter.
export interface ListingState {
  sort: SortKey
  colors: string[]
  sizes: string[]
  brands: string[]
  /** In whole pounds, as shown to the shopper. */
  minPrice: number | null
  maxPrice: number | null
  availableOnly: boolean
  onSaleOnly: boolean
  page: number
}

export const emptyListing: ListingState = {
  sort: 'newest',
  colors: [],
  sizes: [],
  brands: [],
  minPrice: null,
  maxPrice: null,
  availableOnly: false,
  onSaleOnly: false,
  page: 1,
}

const list = (value: string | null) => (value ? value.split(',').filter(Boolean) : [])

function wholeNumber(value: string | null): number | null {
  if (value === null || !/^\d{1,7}$/.test(value)) return null
  return Number(value)
}

// Reads the URL defensively: anything unknown or malformed is ignored, never thrown.
export function parseListing(search: URLSearchParams): ListingState {
  const sort = search.get('sort')
  let minPrice = wholeNumber(search.get('min'))
  let maxPrice = wholeNumber(search.get('max'))
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) [minPrice, maxPrice] = [maxPrice, minPrice]

  return {
    sort: sortKeys.includes(sort as SortKey) ? (sort as SortKey) : emptyListing.sort,
    colors: list(search.get('colors')),
    sizes: list(search.get('sizes')),
    brands: list(search.get('brands')),
    minPrice,
    maxPrice,
    availableOnly: search.get('available') === '1',
    onSaleOnly: search.get('sale') === '1',
    page: Math.max(1, wholeNumber(search.get('page')) ?? 1),
  }
}

// Defaults are left out, so the address stays short (/shop, not /shop?sort=newest&page=1).
export function writeListing(state: ListingState, base: URLSearchParams = new URLSearchParams()): URLSearchParams {
  const search = new URLSearchParams(base)
  for (const key of ['sort', 'colors', 'sizes', 'brands', 'min', 'max', 'available', 'sale', 'page']) search.delete(key)

  if (state.sort !== emptyListing.sort) search.set('sort', state.sort)
  if (state.colors.length) search.set('colors', state.colors.join(','))
  if (state.sizes.length) search.set('sizes', state.sizes.join(','))
  if (state.brands.length) search.set('brands', state.brands.join(','))
  if (state.minPrice !== null) search.set('min', String(state.minPrice))
  if (state.maxPrice !== null) search.set('max', String(state.maxPrice))
  if (state.availableOnly) search.set('available', '1')
  if (state.onSaleOnly) search.set('sale', '1')
  if (state.page > 1) search.set('page', String(state.page))
  return search
}

// How many filters are on (sorting and paging aren't filters).
export function activeFilterCount(state: ListingState): number {
  return (
    state.colors.length +
    state.sizes.length +
    state.brands.length +
    (state.minPrice !== null || state.maxPrice !== null ? 1 : 0) +
    (state.availableOnly ? 1 : 0) +
    (state.onSaleOnly ? 1 : 0)
  )
}

export function clearFilters(state: ListingState): ListingState {
  return { ...emptyListing, sort: state.sort }
}

export function toProductParams(state: ListingState, base: { category?: string; searchValue?: string }): ProductListParams {
  return {
    ...base,
    sort: sortOrders[state.sort],
    colors: state.colors,
    sizes: state.sizes,
    brandIds: state.brands,
    minPricePiasters: state.minPrice === null ? undefined : state.minPrice * 100,
    maxPricePiasters: state.maxPrice === null ? undefined : state.maxPrice * 100,
    availableOnly: state.availableOnly,
    onSaleOnly: state.onSaleOnly,
    pageNumber: state.page,
    pageSize,
  }
}
