import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { AdminOrder } from '@/features/adminOrders'
import { useCreateReturn, type ReturnChannel } from '@/features/adminReturns'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, Checkbox, Input, Select, Textarea } from '@/shared/ui'
import styles from '../Admin.module.scss'

// A return is opened by staff after the customer asks for it on WhatsApp or by email. Only pieces not already in a return can be chosen.
export function CreateReturnPanel({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const navigate = useNavigate()
  const create = useCreateReturn(order.id)
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<ReturnChannel>('WhatsApp')
  const [reason, setReason] = useState('')
  const [storeFault, setStoreFault] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<{ reason?: string; items?: string }>({})

  if (!order.canRequestReturn) return null

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t('admin.returns.create')}
        </Button>
      </div>
    )
  }

  const items = order.items.map((item) => ({ item, available: item.quantity - item.returnedQuantity }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const chosen = items
      .map(({ item, available }) => ({ orderItemId: item.id, quantity: Number(quantities[item.id] ?? 0), available }))
      .filter((entry) => entry.quantity > 0)
    const found = {
      reason: reason.trim() ? undefined : t('checkout.errors.required'),
      items: chosen.length > 0 && chosen.every((entry) => Number.isInteger(entry.quantity) && entry.quantity <= entry.available) ? undefined : t('admin.returns.pickItems'),
    }
    setErrors(found)
    if (found.reason || found.items) return
    create.mutate(
      { channel, reason: reason.trim(), isStoreFault: storeFault, items: chosen.map(({ orderItemId, quantity }) => ({ orderItemId, quantity })) },
      { onSuccess: (created) => navigate(`/admin/returns/${(created as { id: string }).id}`) },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{t('admin.returns.create')}</h3>
      {create.error && <Alert tone="error" title={errorMessage(create.error, t)} />}
      {errors.items && <Alert tone="error" title={errors.items} />}
      {items.map(({ item, available }) => (
        <Input
          key={item.id}
          label={`${localize(item.productNameAr, item.productNameEn)} · ${item.size}`}
          hint={t('admin.returns.available', { count: available })}
          type="number"
          min={0}
          max={available}
          disabled={available === 0}
          value={quantities[item.id] ?? ''}
          onChange={(event) => { setQuantities((current) => ({ ...current, [item.id]: event.target.value })); setErrors((c) => ({ ...c, items: undefined })) }}
        />
      ))}
      <Select
        label={t('admin.returns.channel')}
        value={channel}
        onChange={(event) => setChannel(event.target.value as ReturnChannel)}
        options={[
          { value: 'WhatsApp', label: 'WhatsApp' },
          { value: 'Email', label: t('checkout.email') },
        ]}
      />
      <Textarea label={t('admin.returns.reason')} value={reason} onChange={(event) => { setReason(event.target.value); setErrors((c) => ({ ...c, reason: undefined })) }} error={errors.reason} required />
      <Checkbox checked={storeFault} onChange={(event) => setStoreFault(event.target.checked)} label={t('admin.returns.storeFault')} hint={t('admin.returns.storeFaultHint')} />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('track.keep')}
        </Button>
        <Button type="submit" loading={create.isPending}>
          {t('admin.returns.create')}
        </Button>
      </div>
    </form>
  )
}
