export function discountPercent(price: number, compareAt: number | null): number | null {
  return compareAt && compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : null
}
