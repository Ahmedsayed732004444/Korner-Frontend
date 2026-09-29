import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { EmptyState } from '@/shared/ui'
import { ProductListing } from './listing/ProductListing'
import styles from './listing/Header.module.scss'

export function SearchPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const query = params.get('q')?.trim() ?? ''
  useDocumentTitle(query ? t('search.titleFor', { query }) : t('search.title'))

  if (!query) {
    return (
      <div className="container">
        <EmptyState icon={Search} title={t('search.emptyTitle')} text={t('search.emptyText')} />
      </div>
    )
  }

  return (
    <ProductListing
      searchValue={query}
      breadcrumb={[{ label: t('common.home'), to: '/' }, { label: t('search.title') }]}
      header={
        <>
          <h1 className={styles.title}>{t('search.titleFor', { query })}</h1>
        </>
      }
    />
  )
}
