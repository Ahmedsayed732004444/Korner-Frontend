import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAddOrderNote,
  useCancelOrderAsAdmin,
  useChangeOrderStatus,
  useClearReview,
  useShipOrder,
  type AdminOrder,
} from '@/features/adminOrders'
import { errorMessage, usePermissions } from '@/shared/api'
import { Permissions } from '@/shared/lib/permissions'
import type { OrderStatus } from '@/shared/lib/orderStatus'
import { Alert, Button, Input, Select, Textarea } from '@/shared/ui'
import styles from './Admin.module.scss'

// The API only accepts these three through the status action; shipping, cancelling and returns have their own actions.
const statusActions: OrderStatus[] = ['Processing', 'Delivered', 'ReturnedToOrigin']

export function OrderActions({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  if (!can(Permissions.ordersWrite)) return null

  const nextStatuses = order.availableStatuses.filter((status) => statusActions.includes(status))
  const needsReview = order.reviewReasons.length > 0

  return (
    <section className={styles.panel}>
      <h2>{t('admin.actions.title')}</h2>
      {needsReview && <ClearReviewForm id={order.id} />}
      {nextStatuses.length > 0 && !needsReview && <StatusForm id={order.id} statuses={nextStatuses} />}
      {order.canShip && <ShipForm id={order.id} order={order} />}
      {!order.canShip && order.trackingNumber && <ShipForm id={order.id} order={order} correcting />}
      <NoteForm id={order.id} />
      {order.canCancel && <CancelForm id={order.id} />}
    </section>
  )
}

function StatusForm({ id, statuses }: { id: string; statuses: OrderStatus[] }) {
  const { t } = useTranslation()
  const change = useChangeOrderStatus(id)
  const [status, setStatus] = useState(statuses[0])
  const [note, setNote] = useState('')

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    change.mutate({ status, note: note.trim() || null }, { onSuccess: () => setNote('') })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {change.error && <Alert tone="error" title={errorMessage(change.error, t)} />}
      <Select label={t('admin.actions.moveTo')} value={status} onChange={(event) => setStatus(event.target.value as OrderStatus)} options={statuses.map((item) => ({ value: item, label: t(`track.status.${item}`) }))} />
      <Input label={t('admin.actions.note')} optional value={note} onChange={(event) => setNote(event.target.value)} />
      <Button type="submit" loading={change.isPending}>
        {t('admin.actions.apply')}
      </Button>
    </form>
  )
}

function ShipForm({ id, order, correcting = false }: { id: string; order: AdminOrder; correcting?: boolean }) {
  const { t } = useTranslation()
  const ship = useShipOrder(id)
  const [carrier, setCarrier] = useState(order.carrierName ?? '')
  const [number, setNumber] = useState(order.trackingNumber ?? '')
  const [url, setUrl] = useState(order.trackingUrl ?? '')
  const [error, setError] = useState<string>()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!carrier.trim() || !number.trim()) return setError(t('checkout.errors.required'))
    ship.mutate({ carrierName: carrier.trim(), trackingNumber: number.trim(), trackingUrl: url.trim() || null })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h3>{correcting ? t('admin.actions.fixShipment') : t('admin.actions.ship')}</h3>
      {ship.error && <Alert tone="error" title={errorMessage(ship.error, t)} />}
      <Input label={t('track.carrier')} value={carrier} onChange={(event) => { setCarrier(event.target.value); setError(undefined) }} error={error && !carrier.trim() ? error : undefined} required />
      <Input label={t('track.trackingNumber')} value={number} onChange={(event) => { setNumber(event.target.value); setError(undefined) }} error={error && !number.trim() ? error : undefined} required />
      <Input label={t('admin.actions.trackingUrl')} type="url" optional value={url} onChange={(event) => setUrl(event.target.value)} />
      <Button type="submit" loading={ship.isPending}>
        {correcting ? t('account.save') : t('admin.actions.ship')}
      </Button>
    </form>
  )
}

function ClearReviewForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const clear = useClearReview(id)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string>()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!note.trim()) return setError(t('checkout.errors.required'))
    clear.mutate(note.trim(), { onSuccess: () => setNote('') })
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h3>{t('admin.actions.clearReview')}</h3>
      <p>{t('admin.actions.clearReviewHint')}</p>
      {clear.error && <Alert tone="error" title={errorMessage(clear.error, t)} />}
      <Textarea label={t('admin.actions.reviewNote')} value={note} onChange={(event) => { setNote(event.target.value); setError(undefined) }} error={error} required />
      <Button type="submit" loading={clear.isPending}>
        {t('admin.actions.clearReview')}
      </Button>
    </form>
  )
}

function NoteForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const add = useAddOrderNote(id)
  const [body, setBody] = useState('')
  const [images, setImages] = useState<File[]>([])
  const [inputKey, setInputKey] = useState(0)
  const [error, setError] = useState<string>()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!body.trim()) return setError(t('checkout.errors.required'))
    add.mutate(
      { body: body.trim(), images },
      {
        onSuccess: () => {
          setBody('')
          setImages([])
          setInputKey((key) => key + 1)
        },
      },
    )
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h3>{t('admin.actions.addNote')}</h3>
      {add.error && <Alert tone="error" title={errorMessage(add.error, t)} />}
      <Textarea label={t('admin.orders.notes')} value={body} onChange={(event) => { setBody(event.target.value); setError(undefined) }} error={error} required />
      <input key={inputKey} type="file" accept="image/*" multiple aria-label={t('admin.actions.photos')} onChange={(event) => setImages(Array.from(event.target.files ?? []))} />
      <Button type="submit" variant="secondary" loading={add.isPending}>
        {t('admin.actions.addNote')}
      </Button>
    </form>
  )
}

function CancelForm({ id }: { id: string }) {
  const { t } = useTranslation()
  const cancel = useCancelOrderAsAdmin(id)
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string>()

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t('track.cancel')}
        </Button>
      </div>
    )
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!reason.trim()) return setError(t('checkout.errors.required'))
    cancel.mutate(reason.trim())
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h3>{t('track.cancel')}</h3>
      <p>{t('admin.actions.cancelHint')}</p>
      {cancel.error && <Alert tone="error" title={errorMessage(cancel.error, t)} />}
      <Textarea label={t('admin.actions.cancelReason')} value={reason} onChange={(event) => { setReason(event.target.value); setError(undefined) }} error={error} required />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('track.keep')}
        </Button>
        <Button type="submit" loading={cancel.isPending}>
          {t('track.cancelYes')}
        </Button>
      </div>
    </form>
  )
}
