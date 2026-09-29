import type { TFunction } from 'i18next'

// Sizes come from the store as plain text; the one-size value is shown in the shopper's language.
export function sizeLabel(size: string, t: TFunction): string {
  return size.toLowerCase() === 'one size' ? t('catalog.oneSize') : size
}
