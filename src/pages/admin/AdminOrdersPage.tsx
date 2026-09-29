import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdminOrders, useOrderCounts } from '@/features/adminOrders'
import { errorMessage } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { formatPiasters } from '@/shared/lib/money'
import type { OrderStatus } from '@/shared/lib/orderStatus'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, EmptyState, Input, OrderStatusBadge, Pagination, Skeleton } from '@/shared/ui'
import { PackageSearch } from 'lucide-react'
import styles from './Admin.module.scss'

const statuses: OrderStatus[] = ['PendingPayment', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'ReturnedToOrigin', 'ReturnRequested', 'ReturnClosed']
const pageSize = 20

// The filters live in the address, so a filtered list can be shared, bookmarked and survives Back.
export function AdminOrdersPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('admin.nav.orders'))
  const [params, setParams] = useSearchParams()
  const status = statuses.find((item) => item === params.get('status')) ?? null
  const search = params.get('q') ?? ''
  const needsReviewOnly = params.get('review') === '1'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [typed, setTyped] = useState(search)

  const { data, isLoading, error, isPlaceholderData } = useAdminOrders({ status, search, needsReviewOnly, page, pageSize })
  const { data: counts } = useOrderCounts()
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })

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
      <h1>{t('admin.nav.orders')}</h1>

      <div className={styles.tabs} role="group" aria-label={t('admin.orders.filterByStatus')}>
        <button type="button" aria-pressed={!status && !needsReviewOnly} onClick={() => update({ status: null, review: null })}>
          {t('admin.orders.all')}
        </button>
        {counts && counts.needsReview > 0 && (
          <button type="button" aria-pressed={needsReviewOnly} onClick={() => update({ status: null, review: '1' })}>
            {t('admin.orders.needsReview')} ({counts.needsReview})
          </button>
        )}
        {statuses.map((item) => (
          <button key={item} type="button" aria-pressed={status === item} onClick={() => update({ status: item, review: null })}>
            {t(`track.status.${item}`)} ({counts?.counts[item] ?? 0})
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
        <Input label={t('admin.orders.search')} hint={t('admin.orders.searchHint')} type="search" value={typed} onChange={(event) => setTyped(event.target.value)} />
      </form>

      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 320 }} />}

      {data && data.items.length === 0 && <EmptyState icon={PackageSearch} title={t('admin.orders.none')} text={t('admin.orders.noneText')} />}

      {data && data.items.length > 0 && (
        <div className={styles.tableWrap} aria-busy={isPlaceholderData}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('admin.orders.number')}</th>
                <th scope="col">{t('admin.orders.customer')}</th>
                <th scope="col">{t('admin.orders.status')}</th>
                <th scope="col">{t('admin.orders.total')}</th>
                <th scope="col">{t('admin.orders.paid')}</th>
                <th scope="col">{t('admin.orders.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => (
                <tr key={order.id}>
                  <td className="num">
                    <Link to={`/admin/orders/${order.id}`}>{order.number}</Link>
                  </td>
                  <td>
                    {order.customerName}
                    <br />
                    <small dir="ltr">{order.customerPhone}</small>
                  </td>
                  <td>
                    <OrderStatusBadge status={order.status} /> {order.needsReview && <Badge tone="warning">{t('admin.orders.review')}</Badge>}
                  </td>
                  <td className="num">{formatPiasters(order.totalPiasters, i18n.language)}</td>
                  <td className="num">{formatPiasters(order.paidPiasters, i18n.language)}</td>
                  <td className="num">{date.format(asUtc(order.createdAt))}</td>
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
