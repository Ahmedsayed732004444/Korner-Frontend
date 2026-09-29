import { useState } from 'react'
import { PackageSearch } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminProducts, type ProductStatus } from '@/features/adminCatalog'
import { errorMessage, usePermissions } from '@/shared/api'
import { formatPiasters } from '@/shared/lib/money'
import { Permissions } from '@/shared/lib/permissions'
import { useLocalize } from '@/shared/lib/localize'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, ButtonLink, EmptyState, Input, Pagination, Skeleton } from '@/shared/ui'
import styles from './Admin.module.scss'

const statuses: ProductStatus[] = ['Draft', 'Published', 'Hidden']
const pageSize = 20

export function AdminProductsPage() {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  useDocumentTitle(t('admin.nav.products'))
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const status = statuses.find((item) => item === params.get('status')) ?? null
  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [typed, setTyped] = useState(search)
  const { data, isLoading, error, isPlaceholderData } = useAdminProducts({ status, search, page, pageSize })

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return (
    <>
      <div className={styles.headRow}>
        <h1>{t('admin.nav.products')}</h1>
        {can(Permissions.catalogWrite) && <ButtonLink to="/admin/products/new">{t('admin.products.add')}</ButtonLink>}
      </div>

      <div className={styles.tabs} role="group" aria-label={t('admin.orders.filterByStatus')}>
        <button type="button" aria-pressed={!status} onClick={() => update({ status: null })}>
          {t('admin.orders.all')}
        </button>
        {statuses.map((item) => (
          <button key={item} type="button" aria-pressed={status === item} onClick={() => update({ status: item })}>
            {t(`admin.products.status.${item}`)}
          </button>
        ))}
      </div>

      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          update({ q: typed.trim() || null })
        }}
      >
        <Input label={t('admin.orders.search')} hint={t('admin.products.searchHint')} type="search" value={typed} onChange={(event) => setTyped(event.target.value)} />
      </form>

      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 320 }} />}
      {data && data.items.length === 0 && <EmptyState icon={PackageSearch} title={t('admin.products.none')} text={t('admin.orders.noneText')} />}

      {data && data.items.length > 0 && (
        <div className={styles.tableWrap} aria-busy={isPlaceholderData}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('admin.products.product')}</th>
                <th scope="col">{t('admin.orders.status')}</th>
                <th scope="col">{t('admin.products.category')}</th>
                <th scope="col">{t('admin.products.from')}</th>
                <th scope="col">{t('admin.products.stock')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((product) => (
                <tr key={product.id}>
                  <td>
                    <span className={styles.thumbCell}>
                      {product.imageUrl ? <img src={product.imageUrl} alt="" width={40} height={50} loading="lazy" /> : <span className={styles.thumbEmpty} />}
                      <Link to={`/admin/products/${product.id}`}>{localize(product.nameAr, product.nameEn)}</Link>
                    </span>
                  </td>
                  <td>
                    <Badge tone={product.status === 'Published' ? 'success' : product.status === 'Draft' ? 'warning' : 'info'}>{t(`admin.products.status.${product.status}`)}</Badge>
                  </td>
                  <td>{product.categoryNameEn}</td>
                  <td className="num">{formatPiasters(product.minPricePiasters, i18n.language)}</td>
                  <td className="num">
                    {product.inStock ? product.totalStock : <Badge tone="error">{t('admin.products.soldOut')}</Badge>} · {t('admin.products.variants', { count: product.variantsCount })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : null })} />}
    </>
  )
}
