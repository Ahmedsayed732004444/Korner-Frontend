import type { ColorOption, ProductImage, ProductPage, VariantOption } from './api'

export interface Chosen {
  colorId?: string | null
  size?: string | null
}

export interface Selection {
  colorId: string | null
  size: string | null
  colors: (ColorOption & { available: boolean })[]
  sizes: { size: string; available: boolean }[]
  /** The exact variant to buy, once the color and size are settled. */
  variant: VariantOption | null
  price: number
  compareAtPrice: number | null
  /** True when the price shown is only the lowest of several ("from EGP 1,850"). */
  isFromPrice: boolean
}

// Works out what the shopper is actually buying from what they clicked:
// - a color that was never chosen (or is gone) becomes the first one that is in stock;
// - a size only counts if it exists in that color and is in stock;
// - a product with a single size needs no click.
export function resolveSelection(product: ProductPage, chosen: Chosen): Selection {
  const colors = product.colors.map((color) => ({
    ...color,
    available: product.variants.some((variant) => variant.colorId === color.id && variant.isAvailable),
  }))

  const colorId =
    colors.find((color) => color.id === chosen.colorId)?.id ?? colors.find((color) => color.available)?.id ?? colors[0]?.id ?? null

  const ofColor = product.variants.filter((variant) => (colors.length === 0 ? true : variant.colorId === colorId))
  const sizes = ofColor.map((variant) => ({ size: variant.size, available: variant.isAvailable }))

  const clicked = sizes.find((option) => option.size === chosen.size && option.available)
  const only = sizes.length === 1 && sizes[0].available ? sizes[0] : undefined
  const size = (clicked ?? only)?.size ?? null

  const variant = size === null ? null : (ofColor.find((item) => item.size === size) ?? null)
  const prices = product.variants.map((item) => item.pricePiasters)

  return {
    colorId,
    size,
    colors,
    sizes,
    variant,
    price: variant?.pricePiasters ?? product.minPricePiasters,
    compareAtPrice: variant?.compareAtPricePiasters ?? null,
    isFromPrice: variant === null && new Set(prices).size > 1,
  }
}

// Photos of the chosen color, plus the ones that belong to every color. Falls back to all photos so the gallery is never empty.
export function imagesForColor(product: ProductPage, colorId: string | null): ProductImage[] {
  const matching = product.images.filter((image) => image.colorId === null || image.colorId === colorId)
  return [...(matching.length > 0 ? matching : product.images)].sort((a, b) => a.sortOrder - b.sortOrder)
}

// Delivery days shown to the shopper: the governorates' range, pushed back by the preparation time of made-to-order items.
export function deliveryDays(product: ProductPage, variant: VariantOption | null): { min: number; max: number } | null {
  if (!product.delivery) return null
  const lead = variant?.fulfillmentType === 'OnDemand' ? variant.leadTimeDays : 0
  return { min: product.delivery.minDays + lead, max: product.delivery.maxDays + lead }
}
