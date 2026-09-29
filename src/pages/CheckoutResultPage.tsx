import { CircleAlert, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { lastOrder, usePaymentStatus, useStartPayment } from '@/features/checkout'
import { errorMessage } from '@/shared/api'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Button, ButtonLink, EmptyState, Spinner } from '@/shared/ui'
import styles from './CheckoutResultPage.module.scss'

// Paymob sends the shopper back here. The page never trusts the redirect: it asks the API, which asks the gateway.
export function CheckoutResultPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('result.title'))
  const order = lastOrder.get()
  const { data: status, error, refetch } = usePaymentStatus(order?.number ?? null, order?.phone ?? '')
  const retry = useStartPayment()

  if (!order) {
    return (
      <div className="container">
        <EmptyState icon={CircleAlert} title={t('result.unknownTitle')} text={t('result.unknownText')} action={<Link to="/">{t('common.home')}</Link>} />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`container ${styles.page}`}>
        <Alert tone="error" title={errorMessage(error, t)} action={<Button size="sm" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      </div>
    )
  }

  if (!status || status.state === 'Confirming') {
    return (
      <div className={`container ${styles.page}`} role="status" aria-live="polite">
        <Spinner size="lg" />
        <h1>{t('result.confirming')}</h1>
        <p>{t('result.confirmingText')}</p>
      </div>
    )
  }

  if (status.state === 'Paid') {
    return (
      <div className={`container ${styles.page}`}>
        <CircleCheck size={56} className={styles.success} aria-hidden="true" />
        <h1>{t('result.paidTitle')}</h1>
        <p>{t('result.paidText', { number: status.orderNumber, amount: formatPiasters(status.totalPiasters, i18n.language) })}</p>
        {status.expectedDeliveryDate && (
          <p>
            {t('result.expected', {
              date: new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'full' }).format(new Date(`${status.expectedDeliveryDate}T00:00:00`)),
            })}
          </p>
        )}
        <p>{t('result.emailSent')}</p>
        <div className={styles.actions}>
          <ButtonLink to="/orders/track">{t('result.track')}</ButtonLink>
          <ButtonLink to="/shop" variant="ghost">
            {t('checkout.continueShopping')}
          </ButtonLink>
        </div>
      </div>
    )
  }

  const startAgain = async () => {
    const session = await retry.mutateAsync({ orderNumber: order.number, method: 'Card', phone: order.phone })
    window.location.assign(session.checkoutUrl)
  }

  return (
    <div className={`container ${styles.page}`}>
      <CircleAlert size={56} className={styles.failure} aria-hidden="true" />
      <h1>{t('result.failedTitle')}</h1>
      <p>{t('result.failedText', { number: status.orderNumber })}</p>
      {retry.error && <Alert tone="error" title={errorMessage(retry.error, t)} />}
      <div className={styles.actions}>
        {status.canRetry && (
          <Button onClick={() => void startAgain().catch(() => undefined)} loading={retry.isPending}>
            {t('result.retry')}
          </Button>
        )}
        <ButtonLink to="/cart" variant="ghost">
          {t('result.backToCart')}
        </ButtonLink>
      </div>
    </div>
  )
}
