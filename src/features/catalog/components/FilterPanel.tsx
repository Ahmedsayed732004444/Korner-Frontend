import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLocalize } from '@/shared/lib/localize'
import { Checkbox, Input, SizeMultiPicker } from '@/shared/ui'
import type { ProductFacets } from '../api'
import type { ListingState } from '../filters'
import { sizeLabel } from '../labels'
import styles from './FilterPanel.module.scss'

interface FilterPanelProps {
  facets: ProductFacets | undefined
  state: ListingState
  onChange: (patch: Partial<ListingState>) => void
}

const toggle = (values: string[], value: string) => (values.includes(value) ? values.filter((item) => item !== value) : [...values, value])

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className={styles.section} open={defaultOpen}>
      <summary>
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div className={styles.sectionBody}>{children}</div>
    </details>
  )
}

// The same panel is the desktop sidebar and the mobile sheet. Choices apply straight away.
export function FilterPanel({ facets, state, onChange }: FilterPanelProps) {
  const { t } = useTranslation()
  const localize = useLocalize()

  return (
    <div className={styles.panel}>
      <Section title={t('catalog.filters.availability')}>
        <Checkbox label={t('catalog.filters.inStockOnly')} checked={state.availableOnly} onChange={(event) => onChange({ availableOnly: event.target.checked })} />
        <Checkbox label={t('catalog.filters.onSaleOnly')} checked={state.onSaleOnly} onChange={(event) => onChange({ onSaleOnly: event.target.checked })} />
      </Section>

      {facets && facets.colors.length > 0 && (
        <Section title={t('catalog.filters.color')}>
          {facets.colors.map((color) => (
            <Checkbox
              key={color.id}
              checked={state.colors.includes(color.id)}
              onChange={() => onChange({ colors: toggle(state.colors, color.id) })}
              label={
                <span className={styles.row}>
                  <i className={styles.dot} style={{ background: color.hexCode }} aria-hidden="true" />
                  {localize(color.nameAr, color.nameEn)}
                  <small>({color.productsCount})</small>
                </span>
              }
            />
          ))}
        </Section>
      )}

      {facets && facets.sizes.length > 0 && (
        <Section title={t('catalog.filters.size')}>
          <SizeMultiPicker
            legend={t('catalog.filters.size')}
            options={facets.sizes.map((size) => ({ value: size, label: sizeLabel(size, t) }))}
            values={state.sizes}
            onChange={(sizes) => onChange({ sizes })}
          />
        </Section>
      )}

      {facets && facets.brands.length > 0 && (
        <Section title={t('catalog.filters.brand')}>
          {facets.brands.map((brand) => (
            <Checkbox
              key={brand.id}
              checked={state.brands.includes(brand.id)}
              onChange={() => onChange({ brands: toggle(state.brands, brand.id) })}
              label={
                <span className={styles.row}>
                  {localize(brand.nameAr, brand.nameEn)}
                  <small>({brand.productsCount})</small>
                </span>
              }
            />
          ))}
        </Section>
      )}

      {facets && facets.minPricePiasters !== null && facets.maxPricePiasters !== null && facets.minPricePiasters !== facets.maxPricePiasters && (
        <Section title={t('catalog.filters.price')}>
          <PriceRange
            // New values from the URL (clear all, back button) start the fields over.
            key={`${state.minPrice}-${state.maxPrice}`}
            min={state.minPrice}
            max={state.maxPrice}
            lowest={Math.floor(facets.minPricePiasters / 100)}
            highest={Math.ceil(facets.maxPricePiasters / 100)}
            onChange={onChange}
          />
        </Section>
      )}
    </div>
  )
}

interface PriceRangeProps {
  min: number | null
  max: number | null
  lowest: number
  highest: number
  onChange: (patch: Partial<ListingState>) => void
}

// Typing is free; the filter is applied when the field is left or Enter is pressed, so the list doesn't reload on every digit.
function PriceRange({ min, max, lowest, highest, onChange }: PriceRangeProps) {
  const { t } = useTranslation()
  const [from, setFrom] = useState(min?.toString() ?? '')
  const [to, setTo] = useState(max?.toString() ?? '')

  const commit = () => {
    const parse = (text: string) => (/^\d{1,7}$/.test(text.trim()) ? Number(text) : null)
    let nextMin = parse(from)
    let nextMax = parse(to)
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) [nextMin, nextMax] = [nextMax, nextMin]
    if (nextMin !== min || nextMax !== max) onChange({ minPrice: nextMin, maxPrice: nextMax })
  }

  return (
    <form
      className={styles.price}
      onSubmit={(event) => {
        event.preventDefault()
        commit()
      }}
    >
      <Input label={t('catalog.filters.from')} type="number" inputMode="numeric" min={0} placeholder={String(lowest)} value={from} onChange={(event) => setFrom(event.target.value)} onBlur={commit} />
      <Input label={t('catalog.filters.to')} type="number" inputMode="numeric" min={0} placeholder={String(highest)} value={to} onChange={(event) => setTo(event.target.value)} onBlur={commit} />
    </form>
  )
}
