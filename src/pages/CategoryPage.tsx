import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useCategoryPage } from '@/features/catalog'
import { ApiError } from '@/shared/api'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, EmptyState, Skeleton } from '@/shared/ui'
import { ProductListing } from './listing/ProductListing'
import styles from './listing/Header.module.scss'

export function CategoryPage() {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { slug = '' } = useParams()
  const { data: category, isLoading, error, refetch } = useCategoryPage(slug)
  const name = category ? localize(category.nameAr, category.nameEn) : undefined
  useDocumentTitle(name)

  if (isLoading) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        <Skeleton style={{ height: 40, width: 220 }} />
      </div>
    )
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="container">
        <EmptyState icon={SearchX} title={t('catalog.categoryNotFound')} text={t('catalog.categoryNotFoundText')} action={<Link to="/shop">{t('home.viewAll')}</Link>} />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        <Alert tone="error" title={t('errors.generic')} action={<Button size="sm" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      </div>
    )
  }

  const link = (item: { slugAr: string; slugEn: string }) => `/c/${localize(item.slugAr, item.slugEn)}`

  return (
    <ProductListing
      category={slug}
      breadcrumb={[
        { label: t('common.home'), to: '/' },
        ...(category.parent ? [{ label: localize(category.parent.nameAr, category.parent.nameEn), to: link(category.parent) }] : []),
        { label: name },
      ]}
      header={
        <>
          <h1 className={styles.title}>{name}</h1>
          {category.children.length > 0 && (
            <ul className={styles.subcategories} aria-label={t('catalog.subcategories')}>
              {category.children.map((child) => (
                <li key={child.id}>
                  <Link to={link(child)}>{localize(child.nameAr, child.nameEn)}</Link>
                </li>
              ))}
            </ul>
          )}
        </>
      }
    />
  )
}
