import type { TFunction } from 'i18next'
import { ApiError } from './http'

// Backend error codes ("Cart.OutOfStock") become human text in the current language, with a safe fallback.
export function errorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    if (error.code && t(`errors.${error.code}`, { defaultValue: '' })) return t(`errors.${error.code}`)
    if (error.status === 429) return t('errors.TooManyRequests')
    if (error.status >= 500) return t('errors.server')
  }
  if (error instanceof TypeError) return t('errors.network')
  return t('errors.generic')
}
