import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Alert } from '@/shared/ui'
import { usePermissions } from '@/shared/api'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { BrandsTab } from './lookups/BrandsTab'
import { CategoriesTab } from './lookups/CategoriesTab'
import { ColorsTab } from './lookups/ColorsTab'
import { SizeChartsTab } from './lookups/SizeChartsTab'
import styles from './Admin.module.scss'

const tabs = ['categories', 'brands', 'colors', 'sizeCharts'] as const
type Tab = (typeof tabs)[number]

// Categories, brands, colors and size charts: the lists the product form picks from. The tab is kept in the address.
export function AdminLookupsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.nav.catalog'))
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const tab: Tab = tabs.find((item) => item === params.get('tab')) ?? 'categories'
  const canWrite = can(Permissions.catalogWrite)

  if (!can(Permissions.catalogRead)) return <Alert tone="warning" title={t('admin.noAccessText')} />

  return (
    <>
      <h1>{t('admin.nav.catalog')}</h1>
      <div className={styles.tabs} role="group" aria-label={t('admin.nav.catalog')}>
        {tabs.map((item) => (
          <button key={item} type="button" aria-pressed={tab === item} onClick={() => setParams(item === 'categories' ? {} : { tab: item })}>
            {t(`admin.lookups.${item}`)}
          </button>
        ))}
      </div>
      {tab === 'categories' && <CategoriesTab canWrite={canWrite} />}
      {tab === 'brands' && <BrandsTab canWrite={canWrite} />}
      {tab === 'colors' && <ColorsTab canWrite={canWrite} />}
      {tab === 'sizeCharts' && <SizeChartsTab canWrite={canWrite} />}
    </>
  )
}
