import { useCallback, useState, type ReactNode } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  ActiveFilters,
  FilterPanel,
  LoadMore,
  ProductGrid,
  activeFilterCount,
  sortKeys,
  toProductParams,
  useFacets,
  useInfiniteProducts,
  useListing,
} from '@/features/catalog'
import { Breadcrumb, Button, Drawer, Select, type Crumb } from '@/shared/ui'
import styles from './ProductListing.module.scss'

interface ProductListingProps {
  /** Category slug when the list is one category. */
  category?: string
  /** Search text when the list is a search result. */
  searchValue?: string
  breadcrumb: Crumb[]
  header: ReactNode
}

// One list for a category, the whole shop and search results: filters, sorting and paging all live in the URL.
export function ProductListing({ category, searchValue, breadcrumb, header }: ProductListingProps) {
  const { t } = useTranslation()
  const { state, update, clear } = useListing()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const facets = useFacets(category, searchValue)
  const { pageNumber: _, ...params } = toProductParams(state, { category, searchValue })
  const products = useInfiniteProducts(params)
  const pages = products.data?.pages
  const items = pages?.flatMap((page) => page.items)
  const filterCount = activeFilterCount(state)
  const total = pages?.[0]?.totalCount
  const { fetchNextPage } = products
  const loadMore = useCallback(() => void fetchNextPage(), [fetchNextPage])

  return (
    <div className="container">
      <div className={styles.top}>
        <Breadcrumb items={breadcrumb} />
        {header}
      </div>

      <div className={styles.layout} id="listing-top">
        <aside className={styles.sidebar} aria-label={t('catalog.filters.title')}>
          <h2 className={styles.sidebarTitle}>{t('catalog.filters.title')}</h2>
          <FilterPanel facets={facets.data} state={state} onChange={update} />
        </aside>

        <div className={styles.results}>
          <div className={styles.toolbar}>
            <Button variant="secondary" size="sm" className={styles.filterButton} startIcon={<SlidersHorizontal size={16} aria-hidden="true" />} onClick={() => setFiltersOpen(true)}>
              {t('catalog.filters.title')}
              {filterCount > 0 && <span className={styles.count}>{filterCount}</span>}
            </Button>

            <p className={styles.total} role="status" aria-live="polite">
              {total === undefined ? '' : t('catalog.resultsCount', { count: total })}
            </p>

            <div className={styles.sort}>
              <Select
                label={<span className="visually-hidden">{t('catalog.sort.label')}</span>}
                value={state.sort}
                onChange={(event) => update({ sort: event.target.value as (typeof sortKeys)[number] })}
                options={sortKeys.map((key) => ({ value: key, label: `${t('catalog.sort.label')}: ${t(`catalog.sort.${key}`)}` }))}
              />
            </div>
          </div>

          <ActiveFilters facets={facets.data} state={state} onChange={update} onClear={clear} />

          <h2 className="visually-hidden">{t('catalog.productsHeading')}</h2>
          <ProductGrid
            products={items}
            isLoading={products.isLoading}
            isRefreshing={products.isPlaceholderData}
            error={products.error}
            onRetry={() => void products.refetch()}
            skeletonCount={8}
            emptyAction={filterCount > 0 ? <Button onClick={clear}>{t('catalog.filters.clearAll')}</Button> : undefined}
          />

          {items && !products.isPlaceholderData && (
            <LoadMore
              shown={items.length}
              total={total ?? 0}
              hasMore={products.hasNextPage}
              loading={products.isFetchingNextPage}
              batches={pages?.length ?? 0}
              onLoad={loadMore}
            />
          )}
        </div>
      </div>

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title={t('catalog.filters.title')}
        side="bottom"
        footer={
          <Button fullWidth size="lg" onClick={() => setFiltersOpen(false)}>
            {total === undefined ? t('common.close') : t('catalog.filters.showResults', { count: total })}
          </Button>
        }
      >
        {filtersOpen && <FilterPanel facets={facets.data} state={state} onChange={update} />}
      </Drawer>
    </div>
  )
}
