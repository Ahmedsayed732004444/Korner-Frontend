import { useState, type FormEvent } from 'react'
import { PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import {
  useAddReturnImages,
  useInspectReturn,
  useReceiveReturn,
  useRefundReturn,
  useRejectReturn,
  useReturn,
  type ReturnDetails,
} from '@/features/adminReturns'
import { ApiError, errorMessage, usePermissions } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters, parsePounds, piastersToPounds } from '@/shared/lib/money'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, Button, Checkbox, EmptyState, Input, Skeleton, Textarea } from '@/shared/ui'
import { returnTone } from './returnTone'
import styles from './Admin.module.scss'

export function AdminReturnPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data: ret, isLoading, error } = useReturn(id)
  useDocumentTitle(ret ? t('admin.returns.title', { number: ret.orderNumber }) : undefined)

  if (isLoading) return <Skeleton style={{ height: 320 }} />
  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return <EmptyState icon={PackageX} title={t('admin.returns.missing')} action={<Link to="/admin/returns">{t('admin.nav.returns')}</Link>} />
  }
  if (error || !ret) return <Alert tone="error" title={errorMessage(error, t)} />

  return <ReturnView ret={ret} />
}

function ReturnView({ ret }: { ret: ReturnDetails }) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const { can } = usePermissions()
  const format = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })
  const money = (value: number) => formatPiasters(value, i18n.language)

  return (
    <>
      <p>
        <Link to="/admin/returns">{t('admin.returns.back')}</Link> · <Link to={`/admin/orders/${ret.orderId}`}>{t('track.orderNumber', { number: ret.orderNumber })}</Link>
      </p>
      <div className={styles.headRow}>
        <h1>{t('admin.returns.title', { number: ret.orderNumber })}</h1>
        <Badge tone={returnTone(ret.status)}>{t(`admin.returns.status.${ret.status}`)}</Badge>
      </div>

      <div className={styles.detail}>
        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>{t('account.items')}</h2>
            <ul className={styles.notes}>
              {ret.items.map((item) => (
                <li key={item.id}>
                  <strong>
                    {localize(item.productNameAr, item.productNameEn)} · {item.size} × {item.quantity}
                  </strong>
                  <span>{money(item.unitPricePiasters * item.quantity)}</span>
                  {item.restocked !== null && <Badge tone={item.restocked ? 'success' : 'warning'}>{item.restocked ? t('admin.returns.restocked') : t('admin.returns.notRestocked')}</Badge>}
                  {item.inspectionNote && <small>{item.inspectionNote}</small>}
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.panel}>
            <h2>{t('admin.returns.reason')}</h2>
            <p>{ret.reason}</p>
            {ret.rejectionReason && <Alert tone="error" title={t('admin.returns.rejectedBecause')}>{ret.rejectionReason}</Alert>}
            {ret.imageUrls.length > 0 && (
              <span>
                {ret.imageUrls.map((url) => (
                  <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt={t('admin.orders.attachment')} width={96} height={96} style={{ objectFit: 'cover', marginInlineEnd: 8 }} loading="lazy" />
                  </a>
                ))}
              </span>
            )}
          </section>
        </div>

        <div className={styles.stack}>
          <section className={styles.panel}>
            <h2>{t('admin.payments.title')}</h2>
            <dl className={styles.facts}>
              <div>
                <dt>{t('admin.returns.suggested')}</dt>
                <dd>{money(ret.suggestedRefundPiasters)}</dd>
              </div>
              <div>
                <dt>{t('account.refunded')}</dt>
                <dd>{money(ret.refundedPiasters)}</dd>
              </div>
              <div>
                <dt>{t('admin.orders.createdAt')}</dt>
                <dd>{format.format(asUtc(ret.createdAt))}</dd>
              </div>
              {ret.receivedAt && (
                <div>
                  <dt>{t('admin.returns.receivedAt')}</dt>
                  <dd>{format.format(asUtc(ret.receivedAt))}</dd>
                </div>
              )}
            </dl>
          </section>
          {can(Permissions.ordersWrite) && <ReturnActions ret={ret} canRefund={can(Permissions.paymentsRefund)} />}
        </div>
      </div>
    </>
  )
}

function ReturnActions({ ret, canRefund }: { ret: ReturnDetails; canRefund: boolean }) {
  const { t } = useTranslation()
  const receive = useReceiveReturn(ret.id)
  const images = useAddReturnImages(ret.id)
  const [files, setFiles] = useState<File[]>([])
  const [inputKey, setInputKey] = useState(0)
  const inspected = ret.items.every((item) => item.restocked !== null)
  const open = ret.status === 'Requested' || ret.status === 'Received'
  const error = receive.error ?? images.error

  return (
    <section className={styles.panel}>
      <h2>{t('admin.actions.title')}</h2>
      {error != null && <Alert tone="error" title={errorMessage(error, t)} />}

      {ret.status === 'Requested' && (
        <Button onClick={() => receive.mutate()} loading={receive.isPending}>
          {t('admin.returns.receive')}
        </Button>
      )}
      {ret.status === 'Received' && !inspected && <InspectForm ret={ret} />}
      {ret.status === 'Received' && inspected && canRefund && <RefundForm ret={ret} />}
      {open && <RejectForm id={ret.id} />}

      <div className={styles.form}>
        <input key={inputKey} type="file" accept="image/*" multiple aria-label={t('admin.actions.photos')} onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
        <div>
          <Button size="sm" variant="secondary" disabled={files.length === 0} loading={images.isPending} onClick={() => images.mutate(files, { onSuccess: () => { setFiles([]); setInputKey((key) => key + 1) } })}>
            {t('admin.returns.addPhotos')}
          </Button>
        </div>
      </div>
    </section>
  )
}

// Every piece is looked at: pieces that are fine go back to stock, the rest stay out. Refunding waits until all are inspected.
function InspectForm({ ret }: { ret: ReturnDetails }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const inspect = useInspectReturn(ret.id)
  const [restock, setRestock] = useState<Record<string, boolean>>(() => Object.fromEntries(ret.items.map((item) => [item.id, true])))
  const [notes, setNotes] = useState<Record<string, string>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    inspect.mutate(ret.items.map((item) => ({ returnItemId: item.id, restock: restock[item.id] ?? false, note: notes[item.id]?.trim() || null })))
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      <h3>{t('admin.returns.inspect')}</h3>
      {inspect.error && <Alert tone="error" title={errorMessage(inspect.error, t)} />}
      {ret.items.map((item) => (
        <div key={item.id} className={styles.form}>
          <Checkbox
            checked={restock[item.id] ?? false}
            onChange={(event) => setRestock((current) => ({ ...current, [item.id]: event.target.checked }))}
            label={`${localize(item.productNameAr, item.productNameEn)} · ${item.size} × ${item.quantity}`}
            hint={t('admin.returns.restockHint')}
          />
          <Input label={t('admin.actions.note')} optional value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} />
        </div>
      ))}
      <Button type="submit" loading={inspect.isPending}>
        {t('admin.returns.saveInspection')}
      </Button>
    </form>
  )
}

function RefundForm({ ret }: { ret: ReturnDetails }) {
  const { t, i18n } = useTranslation()
  const refund = useRefundReturn(ret.id)
  const [key] = useState(() => crypto.randomUUID())
  const [amount, setAmount] = useState(piastersToPounds(ret.suggestedRefundPiasters))
  const [error, setError] = useState<string>()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const piasters = parsePounds(amount)
    if (piasters === null || piasters <= 0) return setError(t('admin.products.invalidAmount'))
    refund.mutate({ idempotencyKey: key, amountPiasters: piasters })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{t('admin.returns.refund')}</h3>
      <p>{t('admin.returns.suggestedHint', { amount: formatPiasters(ret.suggestedRefundPiasters, i18n.language) })}</p>
      {refund.error && <Alert tone="error" title={errorMessage(refund.error, t)} />}
      <Input label={t('admin.payments.amount')} inputMode="decimal" value={amount} onChange={(event) => { setAmount(event.target.value); setError(undefined) }} error={error} required />
      <Button type="submit" loading={refund.isPending}>
        {t('admin.returns.refund')}
      </Button>
    </form>
  )
}

function RejectForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const reject = useRejectReturn(id)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t('admin.returns.reject')}
        </Button>
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!reason.trim()) return setError(t('checkout.errors.required'))
    reject.mutate(reason.trim())
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{t('admin.returns.reject')}</h3>
      {reject.error && <Alert tone="error" title={errorMessage(reject.error, t)} />}
      <Textarea label={t('admin.returns.rejectReason')} value={reason} onChange={(event) => { setReason(event.target.value); setError(undefined) }} error={error} required />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('track.keep')}
        </Button>
        <Button type="submit" loading={reject.isPending}>
          {t('admin.returns.reject')}
        </Button>
      </div>
    </form>
  )
}
