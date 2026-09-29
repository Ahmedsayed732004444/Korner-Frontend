import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAccountOrders } from '@/features/account'
import { errorMessage } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, ButtonLink, EmptyState, OrderStatusBadge, Pagination, Skeleton } from '@/shared/ui'
import styles from './Account.module.scss'

export function AccountOrdersPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('account.orders'))
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const { data, isLoading, error } = useAccountOrders(page)
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium' })

  return (
    <>
      <h1>{t('account.orders')}</h1>
      {isLoading && <Skeleton style={{ height: 240 }} />}
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {data && data.items.length === 0 && (
        <EmptyState icon={ShoppingBag} title={t('account.noOrders')} text={t('account.noOrdersText')} action={<ButtonLink to="/shop">{t('cart.browse')}</ButtonLink>} />
      )}
      {data && data.items.length > 0 && (
        <ul className={styles.list}>
          {data.items.map((order) => (
            <li key={order.number}>
              <Link to={`/account/orders/${order.number}`} className={styles.orderRow}>
                {order.imageUrl ? <img src={order.imageUrl} alt="" width={56} height={70} loading="lazy" /> : <span />}
                <span>
                  <strong>{t('track.orderNumber', { number: order.number })}</strong>
                  <small>
                    {date.format(asUtc(order.createdAt))} · {t('account.itemsCount', { count: order.itemsCount })}
                  </small>
                  <OrderStatusBadge status={order.status} />
                </span>
                <span>{formatPiasters(order.totalPiasters, i18n.language)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={(next) => setParams(next > 1 ? { page: String(next) } : {})} />}
    </>
  )
}
