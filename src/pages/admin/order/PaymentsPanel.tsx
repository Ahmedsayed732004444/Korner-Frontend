import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useCreateRefund, useOrderPayments, useResolveRefund, type OrderPayments, type Refund } from '@/features/adminPayments'
import { errorMessage, usePermissions } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { formatPiasters, parsePounds, piastersToPounds } from '@/shared/lib/money'
import { Permissions } from '@/shared/lib/permissions'
import { Alert, Badge, Button, Input, Skeleton, Textarea } from '@/shared/ui'
import styles from '../Admin.module.scss'

export function PaymentsPanel({ orderId }: { orderId: string }) {
  const { t, i18n } = useTranslation()
  const { can } = usePermissions()
  const allowed = can(Permissions.paymentsRead)
  const { data, isLoading, error } = useOrderPayments(orderId, allowed)
  const format = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })
  const money = (value: number) => formatPiasters(value, i18n.language)

  if (!allowed) return null

  return (
    <section className={styles.panel}>
      <h2>{t('admin.payments.title')}</h2>
      {isLoading && <Skeleton style={{ height: 80 }} />}
      {error && <Alert tone="error" title={errorMessage(error, t)} />}

      {data && (
        <>
          <ul className={styles.notes}>
            {data.attempts.map((attempt) => (
              <li key={attempt.id}>
                <strong>
                  {t(`admin.payments.method.${attempt.method}`)} · {money(attempt.amountPiasters)} <Badge tone={attempt.status === 'Succeeded' ? 'success' : attempt.status === 'Pending' ? 'info' : 'error'}>{t(`admin.payments.attempt.${attempt.status}`)}</Badge>
                </strong>
                {attempt.providerTransactionId && <span dir="ltr">#{attempt.providerTransactionId}</span>}
                {attempt.failureReason && <span>{attempt.failureReason}</span>}
                <small>{format.format(asUtc(attempt.createdAt))}</small>
              </li>
            ))}
            {data.attempts.length === 0 && <li>{t('admin.payments.noAttempts')}</li>}
          </ul>

          {data.refunds.length > 0 && (
            <>
              <h3>{t('admin.payments.refunds')}</h3>
              <ul className={styles.notes}>
                {data.refunds.map((refund) => (
                  <RefundRow key={refund.id} refund={refund} orderId={orderId} canResolve={can(Permissions.paymentsRefund)} />
                ))}
              </ul>
            </>
          )}

          {can(Permissions.paymentsRefund) && <RefundForm orderId={orderId} payments={data} />}
        </>
      )}
    </section>
  )
}

function RefundRow({ refund, orderId, canResolve }: { refund: Refund; orderId: string; canResolve: boolean }) {
  const { t, i18n } = useTranslation()
  const resolve = useResolveRefund(orderId)
  const [note, setNote] = useState('')
  const tone = refund.status === 'Succeeded' ? 'success' : refund.status === 'Failed' ? 'error' : 'warning'

  return (
    <li>
      <strong>
        {formatPiasters(refund.amountPiasters, i18n.language)} <Badge tone={tone}>{t(`admin.payments.refund.${refund.status}`)}</Badge>
      </strong>
      <span>
        {t(`admin.payments.source.${refund.source}`)} · {refund.reason}
      </span>
      {refund.failureReason && <span>{refund.failureReason}</span>}
      {refund.status === 'Unknown' && canResolve && (
        <div className={styles.form}>
          <Alert tone="warning" title={t('admin.payments.unknownHint')} />
          {resolve.error && <Alert tone="error" title={errorMessage(resolve.error, t)} />}
          <Input label={t('admin.actions.note')} optional value={note} onChange={(event) => setNote(event.target.value)} />
          <div className={styles.actions}>
            <Button size="sm" onClick={() => resolve.mutate({ refundId: refund.id, succeeded: true, note: note.trim() || null })} loading={resolve.isPending}>
              {t('admin.payments.markDone')}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => resolve.mutate({ refundId: refund.id, succeeded: false, note: note.trim() || null })} disabled={resolve.isPending}>
              {t('admin.payments.markFailed')}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

function RefundForm({ orderId, payments }: { orderId: string; payments: OrderPayments }) {
  const { t, i18n } = useTranslation()
  const create = useCreateRefund(orderId)
  const refundable = Math.max(0, payments.paidPiasters - payments.refundedPiasters)
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState(() => crypto.randomUUID())
  const [amount, setAmount] = useState(piastersToPounds(refundable))
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ amount?: string; reason?: string }>({})

  if (refundable === 0) return null

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => { setAmount(piastersToPounds(refundable)); setOpen(true) }}>
          {t('admin.payments.refundAction')}
        </Button>
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const piasters = parsePounds(amount)
    const found = {
      amount: piasters !== null && piasters > 0 && piasters <= refundable ? undefined : t('admin.payments.amountRange', { max: formatPiasters(refundable, i18n.language) }),
      reason: reason.trim() ? undefined : t('checkout.errors.required'),
    }
    setErrors(found)
    if (found.amount || found.reason || piasters === null) return
    create.mutate(
      { idempotencyKey: key, amountPiasters: piasters, reason: reason.trim(), paymentAttemptId: null },
      {
        onSuccess: () => {
          setKey(crypto.randomUUID())
          setReason('')
          setOpen(false)
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{t('admin.payments.refundAction')}</h3>
      <p>{t('admin.payments.refundable', { amount: formatPiasters(refundable, i18n.language) })}</p>
      {create.error && <Alert tone="error" title={errorMessage(create.error, t)} />}
      <Input label={t('admin.payments.amount')} inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setErrors((c) => ({ ...c, amount: undefined })) }} error={errors.amount} required />
      <Textarea label={t('admin.payments.reason')} value={reason} onChange={(event) => { setReason(event.target.value); setErrors((c) => ({ ...c, reason: undefined })) }} error={errors.reason} required />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('track.keep')}
        </Button>
        <Button type="submit" loading={create.isPending}>
          {t('admin.payments.refundAction')}
        </Button>
      </div>
    </form>
  )
}
