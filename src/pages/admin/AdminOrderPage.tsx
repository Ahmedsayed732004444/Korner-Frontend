import { PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useAdminOrder, type AdminOrder } from '@/features/adminOrders'
import { ApiError, errorMessage } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, EmptyState, OrderStatusBadge, Skeleton } from '@/shared/ui'
import { OrderItems } from '../order/OrderParts'
import { OrderActions } from './AdminOrderActions'
import styles from './Admin.module.scss'

export function AdminOrderPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data: order, isLoading, error } = useAdminOrder(id)
  useDocumentTitle(order ? t('track.orderNumber', { number: order.number }) : undefined)

  if (isLoading) return <Skeleton style={{ height: 360 }} />

  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return <EmptyState icon={PackageX} title={t('account.orderMissing')} action={<Link to="/admin/orders">{t('admin.nav.orders')}</Link>} />
  }

  if (error || !order) return <Alert tone="error" title={errorMessage(error, t)} />

  return (
    <>
      <p>
        <Link to="/admin/orders">{t('admin.orders.back')}</Link>
      </p>
      <div className={styles.headRow}>
        <h1>{t('track.orderNumber', { number: order.number })}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      {order.reviewReasons.length > 0 && (
        <Alert tone="warning" title={t('admin.review.reasons')}>
          {order.reviewReasons.map((reason) => t(`admin.review.reason.${reason}`, { defaultValue: reason })).join(' · ')}
        </Alert>
      )}

      <div className={styles.detail}>
        <div className={styles.stack}>
          <Items order={order} />
          <Timeline order={order} />
          <Notes order={order} />
        </div>
        <div className={styles.stack}>
          <OrderActions order={order} />
          <Customer order={order} />
          <Totals order={order} />
        </div>
      </div>
    </>
  )
}

function Items({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  return (
    <section className={styles.panel}>
      <h2>{t('account.items')}</h2>
      <OrderItems items={order.items} />
      {order.items.some((item) => item.fulfillmentType === 'OnDemand') && <Badge tone="info">{t('admin.orders.hasMadeToOrder')}</Badge>}
    </section>
  )
}

function Customer({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { address } = order

  return (
    <section className={styles.panel}>
      <h2>{t('admin.orders.customer')}</h2>
      <dl className={styles.facts}>
        <div>
          <dt>{t('checkout.name')}</dt>
          <dd>{order.customerName}</dd>
        </div>
        <div>
          <dt>{t('checkout.phone')}</dt>
          <dd dir="ltr">{order.customerPhone}</dd>
        </div>
        <div>
          <dt>{t('checkout.email')}</dt>
          <dd dir="ltr">{order.customerEmail}</dd>
        </div>
        <div>
          <dt>{t('checkout.governorate')}</dt>
          <dd>{localize(order.governorateNameAr, order.governorateNameEn)}</dd>
        </div>
        <div>
          <dt>{t('checkout.address')}</dt>
          <dd>
            {[address.area, address.street, address.building, address.floor && `${t('checkout.floor')} ${address.floor}`, address.apartment && `${t('checkout.apartment')} ${address.apartment}`, address.landmark]
              .filter(Boolean)
              .join('، ')}
          </dd>
        </div>
      </dl>
    </section>
  )
}

function Totals({ order }: { order: AdminOrder }) {
  const { t, i18n } = useTranslation()
  const money = (value: number) => formatPiasters(value, i18n.language)

  return (
    <section className={styles.panel}>
      <h2>{t('admin.orders.money')}</h2>
      <dl className={styles.facts}>
        <div>
          <dt>{t('cart.subtotal')}</dt>
          <dd>{money(order.subtotalPiasters)}</dd>
        </div>
        <div>
          <dt>{t('cart.shipping')}</dt>
          <dd>{order.shippingFeePiasters === 0 ? t('cart.free') : money(order.shippingFeePiasters)}</dd>
        </div>
        <div>
          <dt>{t('cart.total')}</dt>
          <dd>{money(order.totalPiasters)}</dd>
        </div>
        <div>
          <dt>{t('admin.orders.paid')}</dt>
          <dd>{money(order.paidPiasters)}</dd>
        </div>
        <div>
          <dt>{t('account.refunded')}</dt>
          <dd>{money(order.refundedPiasters)}</dd>
        </div>
      </dl>
    </section>
  )
}

function Timeline({ order }: { order: AdminOrder }) {
  const { t, i18n } = useTranslation()
  const format = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <section className={styles.panel}>
      <h2>{t('track.history')}</h2>
      <ol className={styles.notes}>
        {[...order.history].reverse().map((entry) => (
          <li key={`${entry.toStatus}-${entry.at}`}>
            <strong>{t(`track.status.${entry.toStatus}`)}</strong>
            {entry.note && <span>{entry.note}</span>}
            <small>
              {format.format(asUtc(entry.at))}
              {entry.userName ? ` · ${entry.userName}` : ''}
            </small>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Notes({ order }: { order: AdminOrder }) {
  const { t, i18n } = useTranslation()
  const format = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })
  if (order.notes.length === 0) return null

  return (
    <section className={styles.panel}>
      <h2>{t('admin.orders.notes')}</h2>
      <ul className={styles.notes}>
        {order.notes.map((note) => (
          <li key={note.id}>
            <span>{note.body}</span>
            {note.attachmentUrls.length > 0 && (
              <span>
                {note.attachmentUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={t('admin.orders.attachment')} width={72} height={72} style={{ objectFit: 'cover', marginInlineEnd: 8 }} loading="lazy" />
                  </a>
                ))}
              </span>
            )}
            <small>
              {format.format(asUtc(note.createdAt))}
              {note.authorName ? ` · ${note.authorName}` : ''}
            </small>
          </li>
        ))}
      </ul>
    </section>
  )
}
