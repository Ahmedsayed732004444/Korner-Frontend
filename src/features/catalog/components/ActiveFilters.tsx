import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatPiasters } from '@/shared/lib/money'
import { useLocalize } from '@/shared/lib/localize'
import type { ProductFacets } from '../api'
import { activeFilterCount, type ListingState } from '../filters'
import { sizeLabel } from '../labels'
import styles from './ActiveFilters.module.scss'

interface ActiveFiltersProps {
  facets: ProductFacets | undefined
  state: ListingState
  onChange: (patch: Partial<ListingState>) => void
  onClear: () => void
}

// Every filter that is on, as a chip that removes it. Nothing is hidden inside a closed section.
export function ActiveFilters({ facets, state, onChange, onClear }: ActiveFiltersProps) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  if (activeFilterCount(state) === 0) return null

  const chips: { key: string; label: string; remove: () => void }[] = [
    ...state.colors.map((id) => {
      const color = facets?.colors.find((item) => item.id === id)
      return { key: `color-${id}`, label: color ? localize(color.nameAr, color.nameEn) : t('catalog.filters.color'), remove: () => onChange({ colors: state.colors.filter((item) => item !== id) }) }
    }),
    ...state.sizes.map((size) => ({ key: `size-${size}`, label: sizeLabel(size, t), remove: () => onChange({ sizes: state.sizes.filter((item) => item !== size) }) })),
    ...state.brands.map((id) => {
      const brand = facets?.brands.find((item) => item.id === id)
      return { key: `brand-${id}`, label: brand ? localize(brand.nameAr, brand.nameEn) : t('catalog.filters.brand'), remove: () => onChange({ brands: state.brands.filter((item) => item !== id) }) }
    }),
  ]

  if (state.minPrice !== null || state.maxPrice !== null) {
    const from = state.minPrice !== null ? formatPiasters(state.minPrice * 100, i18n.language) : null
    const to = state.maxPrice !== null ? formatPiasters(state.maxPrice * 100, i18n.language) : null
    const label = from && to ? `${from} – ${to}` : from ? t('catalog.filters.fromPrice', { price: from }) : t('catalog.filters.toPrice', { price: to })
    chips.push({ key: 'price', label, remove: () => onChange({ minPrice: null, maxPrice: null }) })
  }
  if (state.availableOnly) chips.push({ key: 'available', label: t('catalog.filters.inStockOnly'), remove: () => onChange({ availableOnly: false }) })
  if (state.onSaleOnly) chips.push({ key: 'sale', label: t('catalog.filters.onSaleOnly'), remove: () => onChange({ onSaleOnly: false }) })

  return (
    <div className={styles.chips} role="group" aria-label={t('catalog.filters.active')}>
      {chips.map((chip) => (
        <button key={chip.key} type="button" className={styles.chip} onClick={chip.remove} aria-label={t('catalog.filters.remove', { filter: chip.label })}>
          {chip.label}
          <X size={14} aria-hidden="true" />
        </button>
      ))}
      <button type="button" className={styles.clear} onClick={onClear}>
        {t('catalog.filters.clearAll')}
      </button>
    </div>
  )
}
