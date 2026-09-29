import { describe, expect, it } from 'vitest'
import type { ProductPage, VariantOption } from './api'
import { deliveryDays, imagesForColor, resolveSelection } from './selection'

const variant = (overrides: Partial<VariantOption>): VariantOption => ({
  id: 'v',
  colorId: null,
  size: 'M',
  pricePiasters: 10_000,
  compareAtPricePiasters: null,
  fulfillmentType: 'InStock',
  leadTimeDays: 0,
  isAvailable: true,
  ...overrides,
})

const product = (overrides: Partial<ProductPage> = {}): ProductPage => ({
  id: 'p',
  nameAr: 'منتج',
  nameEn: 'Product',
  descriptionAr: '',
  descriptionEn: '',
  slugAr: 'p',
  slugEn: 'p',
  type: 'Apparel',
  category: { id: 'c', nameAr: 'ق', nameEn: 'C', slugAr: 'c', slugEn: 'c' },
  parentCategory: null,
  brand: null,
  perfume: null,
  minPricePiasters: 10_000,
  inStock: true,
  colors: [],
  variants: [],
  images: [],
  sizeChart: null,
  delivery: { minDays: 2, maxDays: 4 },
  ...overrides,
})

const black = { id: 'black', nameAr: 'أسود', nameEn: 'Black', hexCode: '#000' }
const white = { id: 'white', nameAr: 'أبيض', nameEn: 'White', hexCode: '#fff' }

describe('resolveSelection: colors', () => {
  const tee = product({
    colors: [black, white],
    variants: [
      variant({ id: 'b-m', colorId: 'black', size: 'M', isAvailable: false }),
      variant({ id: 'b-l', colorId: 'black', size: 'L', isAvailable: false }),
      variant({ id: 'w-m', colorId: 'white', size: 'M' }),
      variant({ id: 'w-l', colorId: 'white', size: 'L' }),
    ],
  })

  it('starts on the first color that is actually in stock', () => {
    expect(resolveSelection(tee, {}).colorId).toBe('white')
  })

  it('marks a color with nothing left as unavailable', () => {
    expect(resolveSelection(tee, {}).colors.map((color) => [color.id, color.available])).toEqual([['black', false], ['white', true]])
  })

  it('ignores a color that does not belong to the product', () => {
    expect(resolveSelection(tee, { colorId: 'pink' }).colorId).toBe('white')
  })

  it('shows only the sizes of the chosen color', () => {
    expect(resolveSelection(tee, { colorId: 'white' }).sizes.map((s) => s.size)).toEqual(['M', 'L'])
  })
})

describe('resolveSelection: sizes and the variant', () => {
  const shoes = product({
    colors: [black],
    variants: [
      variant({ id: 's41', colorId: 'black', size: '41', pricePiasters: 100_000 }),
      variant({ id: 's42', colorId: 'black', size: '42', pricePiasters: 100_000 }),
      variant({ id: 's44', colorId: 'black', size: '44', pricePiasters: 120_000, isAvailable: false }),
    ],
  })

  it('does not pick a size for the shopper when there is a choice', () => {
    const selection = resolveSelection(shoes, {})

    expect(selection.size).toBeNull()
    expect(selection.variant).toBeNull()
  })

  it('finds the variant for the chosen size', () => {
    expect(resolveSelection(shoes, { size: '42' }).variant?.id).toBe('s42')
  })

  it('refuses a sold-out size even if it was chosen earlier', () => {
    const selection = resolveSelection(shoes, { size: '44' })

    expect(selection.size).toBeNull()
    expect(selection.variant).toBeNull()
  })

  it('drops a size that does not exist in the newly chosen color', () => {
    const two = product({
      colors: [black, white],
      variants: [variant({ id: 'b', colorId: 'black', size: 'S' }), variant({ id: 'b2', colorId: 'black', size: 'M' }), variant({ id: 'w', colorId: 'white', size: 'M' }), variant({ id: 'w2', colorId: 'white', size: 'L' })],
    })

    expect(resolveSelection(two, { colorId: 'white', size: 'S' }).size).toBeNull()
  })

  it('needs no click for a single available size', () => {
    const bag = product({ variants: [variant({ id: 'only', size: 'One Size' })] })

    expect(resolveSelection(bag, {}).variant?.id).toBe('only')
  })

  it('does not auto-pick a single size that is sold out', () => {
    const bag = product({ variants: [variant({ id: 'only', size: 'One Size', isAvailable: false })] })

    expect(resolveSelection(bag, {}).variant).toBeNull()
  })
})

describe('resolveSelection: price', () => {
  const set = product({
    minPricePiasters: 185_000,
    variants: [variant({ id: 'a', size: '30', pricePiasters: 185_000 }), variant({ id: 'b', size: '50', pricePiasters: 265_000 })],
  })

  it('shows "from" the lowest price until a size is chosen', () => {
    const selection = resolveSelection(set, {})

    expect(selection).toMatchObject({ price: 185_000, isFromPrice: true })
  })

  it('shows the exact price of the chosen size, with its old price when on sale', () => {
    const sale = product({ variants: [variant({ id: 'a', size: 'M', pricePiasters: 44_900, compareAtPricePiasters: 59_900 })] })

    expect(resolveSelection(sale, {})).toMatchObject({ price: 44_900, compareAtPrice: 59_900, isFromPrice: false })
    expect(resolveSelection(set, { size: '50' })).toMatchObject({ price: 265_000, isFromPrice: false })
  })

  it('is not "from" when every size costs the same', () => {
    const flat = product({ variants: [variant({ id: 'a', size: 'S' }), variant({ id: 'b', size: 'M' })] })

    expect(resolveSelection(flat, {}).isFromPrice).toBe(false)
  })
})

describe('imagesForColor', () => {
  const image = (id: string, colorId: string | null, sortOrder: number) => ({ id, url: id, colorId, altAr: null, altEn: null, sortOrder })

  it('keeps the chosen color plus the shared photos, in order', () => {
    const p = product({ images: [image('w', 'white', 1), image('shared', null, 2), image('b', 'black', 0)] })

    expect(imagesForColor(p, 'black').map((i) => i.id)).toEqual(['b', 'shared'])
  })

  it('falls back to every photo when the color has none', () => {
    const p = product({ images: [image('b', 'black', 0)] })

    expect(imagesForColor(p, 'white').map((i) => i.id)).toEqual(['b'])
  })
})

describe('deliveryDays', () => {
  it('adds the preparation time of made-to-order items', () => {
    const p = product({ delivery: { minDays: 2, maxDays: 4 } })

    expect(deliveryDays(p, variant({ fulfillmentType: 'OnDemand', leadTimeDays: 7 }))).toEqual({ min: 9, max: 11 })
    expect(deliveryDays(p, variant({}))).toEqual({ min: 2, max: 4 })
  })

  it('is unknown when the store ships nowhere yet', () => {
    expect(deliveryDays(product({ delivery: null }), null)).toBeNull()
  })
})
