import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { lastOrder, isEgyptMobile, normalizeDigits } from '@/features/checkout'
import { useCancelOrder, useTrackOrder, type TrackedOrder } from '@/features/orders'
import { errorMessage } from '@/shared/api'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { isDeliveryPending } from '@/shared/lib/orderStatus'
import { Alert, Button, Input, OrderStatusBadge, Skeleton } from '@/shared/ui'
import { OrderHistory, OrderItems } from './order/OrderParts'
import styles from './TrackOrderPage.module.scss'

interface Lookup {
  number: number
  phone: string
}

export function TrackOrderPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  useDocumentTitle(t('track.title'))

  // The emailed link carries the number; a shopper who just paid also has both remembered.
  const remembered = lastOrder.get()
  const fromLink = Number(params.get('number')) || null
  const [number, setNumber] = useState(String(fromLink ?? remembered?.number ?? ''))
  const [phone, setPhone] = useState(remembered && (!fromLink || fromLink === remembered.number) ? remembered.phone : '')
  const [errors, setErrors] = useState<{ number?: string; phone?: string }>({})
  const [lookup, setLookup] = useState<Lookup | null>(fromLink && remembered?.number === fromLink ? remembered : null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const parsed = Number(normalizeDigits(number).trim())
    const found = {
      number: Number.isInteger(parsed) && parsed > 0 ? undefined : t('track.errors.number'),
      phone: isEgyptMobile(phone) ? undefined : t('track.errors.phone'),
    }
    setErrors(found)
    if (found.number || found.phone) return
    setLookup({ number: parsed, phone: normalizeDigits(phone).trim() })
  }

  return (
    <div className={`container ${styles.page}`}>
      <h1>{t('track.title')}</h1>
      <p className={styles.intro}>{t('track.intro')}</p>

      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <Input
          label={t('track.number')}
          inputMode="numeric"
          value={number}
          onChange={(event) => {
            setNumber(event.target.value)
            setErrors((current) => ({ ...current, number: undefined }))
          }}
          error={errors.number}
          required
        />
        <Input
          label={t('track.phone')}
          type="tel"
          inputMode="numeric"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            setErrors((current) => ({ ...current, phone: undefined }))
          }}
          error={errors.phone}
          autoComplete="tel"
          required
        />
        <Button type="submit" size="lg">
          {t('track.submit')}
        </Button>
      </form>

      {lookup && <Result lookup={lookup} />}
    </div>
  )
}

function Result({ lookup }: { lookup: Lookup }) {
  const { t, i18n } = useTranslation()
  const { data: order, isLoading, error } = useTrackOrder(lookup)
  const cancel = useCancelOrder()
  const [confirming, setConfirming] = useState(false)

  if (isLoading) return <Skeleton style={{ height: 240 }} />
  if (error || !order) return <Alert tone="error" title={errorMessage(error, t)} />

  return (
    <section className={styles.result} aria-live="polite">
      <Summary order={order} language={i18n.language} />
      <OrderItems items={order.items} />
      <OrderHistory history={order.history} />

      {order.canCancel && (
        <div className={styles.cancel}>
          {cancel.error && <Alert tone="error" title={errorMessage(cancel.error, t)} />}
          {confirming ? (
            <>
              <p>{t('track.cancelConfirm')}</p>
              <div className={styles.actions}>
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  {t('track.keep')}
                </Button>
                <Button onClick={() => cancel.mutate(lookup, { onSuccess: () => setConfirming(false) })} loading={cancel.isPending}>
                  {t('track.cancelYes')}
                </Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              {t('track.cancel')}
            </Button>
          )}
        </div>
      )}
    </section>
  )
}

function Summary({ order, language }: { order: TrackedOrder; language: string }) {
  const { t } = useTranslation()
  const date = (value: string) => new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'full' }).format(new Date(value))

  return (
    <div className={styles.summary}>
      <div>
        <p className={styles.label}>{t('track.orderNumber', { number: order.number })}</p>
        <OrderStatusBadge status={order.status} />
      </div>
      <dl>
        {order.expectedDeliveryDate && isDeliveryPending(order.status) && (
          <div>
            <dt>{t('track.expected')}</dt>
            <dd>{date(`${order.expectedDeliveryDate}T00:00:00`)}</dd>
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
        <div>
          <dt>{t('cart.total')}</dt>
          <dd>{formatPiasters(order.totalPiasters, language)}</dd>
        </div>
      </dl>
    </div>
  )
}
