import { useState } from 'react'
import { PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useAccountOrder, useCancelAccountOrder, usePayAccountOrder } from '@/features/account'
import { ApiError, errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { isDeliveryPending } from '@/shared/lib/orderStatus'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Button, EmptyState, OrderStatusBadge, Skeleton } from '@/shared/ui'
import { OrderHistory, OrderItems } from '../order/OrderParts'
import styles from './Account.module.scss'

export function AccountOrderPage() {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const number = Number(useParams().number)
  useDocumentTitle(t('track.orderNumber', { number }))
  const { data: order, isLoading, error } = useAccountOrder(number)
  const cancel = useCancelAccountOrder()
  const pay = usePayAccountOrder()
  const [confirming, setConfirming] = useState(false)
  const formatDate = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'full' })
  const money = (value: number) => formatPiasters(value, i18n.language)

  if (isLoading) return <Skeleton style={{ height: 320 }} />

  if (error instanceof ApiError && error.status === 404) {
    return <EmptyState icon={PackageX} title={t('account.orderMissing')} action={<Link to="/account/orders">{t('account.orders')}</Link>} />
  }

  if (error || !order) return <Alert tone="error" title={errorMessage(error, t)} />

  const startPayment = () =>
    pay.mutate(order.number, { onSuccess: (session) => window.location.assign(session.checkoutUrl) })

  return (
    <>
      <p>
        <Link to="/account/orders">{t('account.backToOrders')}</Link>
      </p>
      <h1>{t('track.orderNumber', { number: order.number })}</h1>
      <div>
        <OrderStatusBadge status={order.status} />
      </div>

      {(cancel.error || pay.error) && <Alert tone="error" title={errorMessage(cancel.error ?? pay.error, t)} />}

      <div className={styles.card}>
        <dl className={styles.details}>
          {order.expectedDeliveryDate && isDeliveryPending(order.status) && (
            <div>
              <dt>{t('track.expected')}</dt>
              <dd>{formatDate.format(new Date(`${order.expectedDeliveryDate}T00:00:00`))}</dd>
            </div>
          )}
          {order.carrierName && (
            <div>
              <dt>{t('track.carrier')}</dt>
              <dd>{order.carrierName}</dd>
            </div>
          )}
          {order.trackingNumber && (
            <div>
              <dt>{t('track.trackingNumber')}</dt>
              <dd>
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    {order.trackingNumber}
                  </a>
                ) : (
                  order.trackingNumber
                )}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <div className={styles.card}>
        <h2>{t('account.items')}</h2>
        <OrderItems items={order.items} />
        <dl className={styles.details}>
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
          {order.refundedPiasters > 0 && (
            <div>
              <dt>{t('account.refunded')}</dt>
              <dd>{money(order.refundedPiasters)}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className={styles.card}>
        <h2>{t('account.deliveryTo')}</h2>
        <address style={{ fontStyle: 'normal' }}>
          {order.recipientName} · <span dir="ltr">{order.phone}</span>
          <br />
          {localize(order.governorateNameAr, order.governorateNameEn)}، {order.address.area}، {order.address.street}، {order.address.building}
          {order.address.floor ? `، ${t('checkout.floor')} ${order.address.floor}` : ''}
          {order.address.apartment ? `، ${t('checkout.apartment')} ${order.address.apartment}` : ''}
        </address>
      </div>

      <div className={styles.card}>
        <h2>{t('track.history')}</h2>
        <OrderHistory history={order.history} />
      </div>

      <div className={styles.actions}>
        {order.canPay && (
          <Button onClick={startPayment} loading={pay.isPending}>
            {t('account.payNow')}
          </Button>
        )}
        {order.canCancel &&
          (confirming ? (
            <>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                {t('track.keep')}
              </Button>
              <Button onClick={() => cancel.mutate(order.number, { onSuccess: () => setConfirming(false) })} loading={cancel.isPending}>
                {t('track.cancelYes')}
              </Button>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              {t('track.cancel')}
            </Button>
          ))}
      </div>
      {confirming && <p>{t('track.cancelConfirm')}</p>}
    </>
  )
}
