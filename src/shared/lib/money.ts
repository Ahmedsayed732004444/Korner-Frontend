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

// Reads "149.5" or "١٤٩٫٥" typed by a person into piasters without floating-point arithmetic. Null when it isn't a valid amount.
export function parsePounds(text: string): number | null {
  const normalized = text
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[٫,]/g, '.')
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(normalized)
  if (!match) return null
  return Number(match[1]) * 100 + Number((match[2] ?? '').padEnd(2, '0'))
}

// The reverse, for filling an input: 14950 becomes "149.5".
export function piastersToPounds(piasters: number): string {
  const pounds = Math.floor(piasters / 100)
  const rest = piasters % 100
  return rest === 0 ? String(pounds) : `${pounds}.${String(rest).padStart(2, '0').replace(/0$/, '')}`
}
