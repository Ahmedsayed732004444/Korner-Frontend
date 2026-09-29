import { useTranslation } from 'react-i18next'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { ProductListing } from './listing/ProductListing'
import styles from './listing/Header.module.scss'

export function ShopPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('shop.title'))

  return (
    <ProductListing
      breadcrumb={[{ label: t('common.home'), to: '/' }, { label: t('shop.title') }]}
      header={<h1 className={styles.title}>{t('shop.title')}</h1>}
    />
  )
}
