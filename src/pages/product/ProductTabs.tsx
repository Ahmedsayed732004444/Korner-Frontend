import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { sizeLabel, type PerfumeDetails, type ProductPage, type SizeChart } from '@/features/catalog'
import { useLocalize } from '@/shared/lib/localize'
import { Tabs, tabPanelProps } from '@/shared/ui'
import styles from './ProductTabs.module.scss'

interface ProductTabsProps {
  product: ProductPage
  returnWindowDays: number
}

// Description always; a fit table or scent notes only when the product has them; shipping and returns always.
export function ProductTabs({ product, returnWindowDays }: ProductTabsProps) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const hasDetails = product.perfume !== null || product.sizeChart !== null
  const items = [
    { id: 'description', label: t('product.tabs.description') },
    ...(hasDetails ? [{ id: 'details', label: product.perfume ? t('product.tabs.scent') : t('product.tabs.sizeChart') }] : []),
    { id: 'shipping', label: t('product.tabs.shipping') },
  ]
  const [active, setActive] = useState('description')
  const current = items.some((item) => item.id === active) ? active : 'description'

  return (
    <section className={styles.tabs} aria-label={t('product.tabs.label')}>
      <Tabs idPrefix="product" label={t('product.tabs.label')} value={current} onChange={setActive} items={items} align="start" />
      <div {...tabPanelProps('product', current)} className={styles.panel}>
        {current === 'description' && <p className={styles.description}>{localize(product.descriptionAr, product.descriptionEn)}</p>}
        {current === 'details' && product.perfume && <PerfumeNotes perfume={product.perfume} />}
        {current === 'details' && !product.perfume && product.sizeChart && <SizeChartTable chart={product.sizeChart} />}
        {current === 'shipping' && (
          <div className={styles.description}>
            <p>{t('product.shippingText')}</p>
            <p>{t('product.returnsText', { days: returnWindowDays })}</p>
            <p>
              <Link to="/pages/shipping">{t('footer.shipping')}</Link> · <Link to="/pages/returns">{t('footer.returns')}</Link>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

function PerfumeNotes({ perfume }: { perfume: PerfumeDetails }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const rows = [
    [t('product.perfume.concentration'), t(`product.perfume.${perfume.concentration}`)],
    [t('product.perfume.family'), localize(perfume.scentFamilyAr, perfume.scentFamilyEn)],
    [t('product.perfume.top'), localize(perfume.topNotesAr, perfume.topNotesEn)],
    [t('product.perfume.heart'), localize(perfume.heartNotesAr, perfume.heartNotesEn)],
    [t('product.perfume.base'), localize(perfume.baseNotesAr, perfume.baseNotesEn)],
  ].filter((row): row is [string, string] => Boolean(row[1]))

  return (
    <dl className={styles.notes}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function SizeChartTable({ chart }: { chart: SizeChart }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const notes = localize(chart.notesAr, chart.notesEn)

  return (
    <div className={styles.chart}>
      <div className={styles.scroll} tabIndex={0} role="region" aria-label={localize(chart.nameAr, chart.nameEn)}>
        <table>
          <thead>
            <tr>
              <th scope="col">{t('product.size')}</th>
              {chart.columns.map((column) => (
                <th key={column.headerEn} scope="col">
                  {localize(column.headerAr, column.headerEn)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((row) => (
              <tr key={row.size}>
                <th scope="row">{sizeLabel(row.size, t)}</th>
                {row.values.map((value, index) => (
                  <td key={index}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {notes && <p className={styles.chartNotes}>{notes}</p>}
    </div>
  )
}
