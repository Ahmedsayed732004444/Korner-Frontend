import type { ReactNode } from 'react'
import { PackageSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { cn } from '@/shared/lib/cn'
import { Alert, Button, EmptyState, Skeleton } from '@/shared/ui'
import type { ProductCard } from '../api'
import { ProductCardView } from './ProductCardView'
import styles from './ProductGrid.module.scss'

interface ProductGridProps {
  products: ProductCard[] | undefined
  isLoading: boolean
  /** True while new results load and the old ones are still shown. */
  isRefreshing?: boolean
  error: unknown
  onRetry: () => void
  /** How many placeholders to show while loading. */
  skeletonCount?: number
  emptyAction?: ReactNode
}

// The four states every product list has: loading, failed (with a way to retry), empty, and the products.
export function ProductGrid({ products, isLoading, isRefreshing = false, error, onRetry, skeletonCount = 8, emptyAction }: ProductGridProps) {
  const { t } = useTranslation()

  if (error) {
    return (
      <Alert tone="error" title={errorMessage(error, t)} action={<Button size="sm" onClick={onRetry}>{t('common.retry')}</Button>} />
    )
  }

  if (isLoading || !products) {
    return (
      <ul className={styles.grid} aria-busy="true" aria-label={t('common.loading')}>
        {Array.from({ length: skeletonCount }, (_, index) => (
          <li key={index} className={styles.skeleton}>
            <Skeleton style={{ aspectRatio: '4 / 5' }} />
            <Skeleton style={{ height: 14, width: '75%' }} />
            <Skeleton style={{ height: 14, width: '35%' }} />
          </li>
        ))}
      </ul>
    )
  }

  if (products.length === 0) {
    return <EmptyState icon={PackageSearch} title={t('catalog.emptyTitle')} text={t('catalog.emptyText')} action={emptyAction} />
  }

  return (
    <ul className={cn(styles.grid, isRefreshing && styles.refreshing)} aria-busy={isRefreshing || undefined}>
      {products.map((product) => (
        <li key={product.id}>
          <ProductCardView product={product} />
        </li>
      ))}
    </ul>
  )
}
