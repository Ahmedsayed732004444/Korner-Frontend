// Money stays in integer piasters (like the API) until it's shown, so no floating-point rounding ever reaches a total.
export function formatPiasters(piasters: number, language: string): string {
  const pounds = piasters / 100
  const hasPiasters = piasters % 100 !== 0

  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: hasPiasters ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(pounds)
}
