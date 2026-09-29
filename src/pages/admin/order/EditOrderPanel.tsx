import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminProduct } from '@/features/adminCatalog'
import { useChangeItemVariant, useRestockOrder, useUpdateOrderAddress, type AdminOrder } from '@/features/adminOrders'
import { useGovernorates } from '@/features/shipping'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, Input, Select } from '@/shared/ui'
import styles from '../Admin.module.scss'

// Before shipping, staff can fix the address and swap a size. The API keeps the price and shipping fee the same and audits both.
export function EditOrderPanel({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  if (!order.canEdit && !order.canRestock) return null

  return (
    <section className={styles.panel}>
      <h2>{t('admin.edit.title')}</h2>
      {order.canEdit && <AddressForm order={order} />}
      {order.canEdit && order.items.map((item) => <SwapForm key={item.id} order={order} itemId={item.id} />)}
      {order.canRestock && <RestockForm order={order} />}
    </section>
  )
}

function AddressForm({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: governorates } = useGovernorates()
  const update = useUpdateOrderAddress(order.id)
  const [open, setOpen] = useState(false)
  const current = governorates?.find((item) => item.nameEn === order.governorateNameEn)
  const [governorateId, setGovernorateId] = useState(current ? String(current.id) : '')
  const [area, setArea] = useState(order.address.area)
  const [street, setStreet] = useState(order.address.street)
  const [building, setBuilding] = useState(order.address.building)
  const [floor, setFloor] = useState(order.address.floor ?? '')
  const [apartment, setApartment] = useState(order.address.apartment ?? '')
  const [landmark, setLandmark] = useState(order.address.landmark ?? '')
  const [error, setError] = useState<string>()

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t('admin.edit.address')}
        </Button>
      </div>
    )
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const id = Number(governorateId) || current?.id
    if (!id || !area.trim() || !street.trim() || !building.trim()) return setError(t('checkout.errors.required'))
    update.mutate(
      { governorateId: id, address: { area: area.trim(), street: street.trim(), building: building.trim(), floor: floor.trim() || null, apartment: apartment.trim() || null, landmark: landmark.trim() || null } },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{t('admin.edit.address')}</h3>
      <p>{t('admin.edit.addressHint')}</p>
      {(error || update.error) && <Alert tone="error" title={error ?? errorMessage(update.error, t)} />}
      <Select
        label={t('checkout.governorate')}
        value={governorateId}
        onChange={(event) => setGovernorateId(event.target.value)}
        options={(governorates ?? []).map((item) => ({ value: String(item.id), label: localize(item.nameAr, item.nameEn) }))}
      />
      <Input label={t('checkout.area')} value={area} onChange={(event) => { setArea(event.target.value); setError(undefined) }} required />
      <Input label={t('checkout.street')} value={street} onChange={(event) => { setStreet(event.target.value); setError(undefined) }} required />
      <Input label={t('checkout.building')} value={building} onChange={(event) => { setBuilding(event.target.value); setError(undefined) }} required />
      <Input label={t('checkout.floor')} optional value={floor} onChange={(event) => setFloor(event.target.value)} />
      <Input label={t('checkout.apartment')} optional value={apartment} onChange={(event) => setApartment(event.target.value)} />
      <Input label={t('checkout.landmark')} optional value={landmark} onChange={(event) => setLandmark(event.target.value)} />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('track.keep')}
        </Button>
        <Button type="submit" loading={update.isPending}>
          {t('account.save')}
        </Button>
      </div>
    </form>
  )
}

function SwapForm({ order, itemId }: { order: AdminOrder; itemId: string }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const item = order.items.find((entry) => entry.id === itemId)!
  const [open, setOpen] = useState(false)
  const { data: product } = useAdminProduct(open ? item.productId : null)
  const swap = useChangeItemVariant(order.id)
  const [variantId, setVariantId] = useState('')

  // Only variants at the same price are offered, the same rule the API enforces.
  const options = (product?.variants ?? []).filter((variant) => variant.id !== item.variantId && variant.isActive && variant.pricePiasters === item.unitPricePiasters)

  if (!open) {
    return (
      <div>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          {t('admin.edit.swap', { name: localize(item.productNameAr, item.productNameEn), size: item.size })}
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <h3>{t('admin.edit.swap', { name: localize(item.productNameAr, item.productNameEn), size: item.size })}</h3>
      {swap.error && <Alert tone="error" title={errorMessage(swap.error, t)} />}
      {product && options.length === 0 && <p>{t('admin.edit.noSwap')}</p>}
      <Select
        label={t('admin.edit.newVariant')}
        placeholder={t('admin.products.choose')}
        value={variantId}
        onChange={(event) => setVariantId(event.target.value)}
        options={options.map((variant) => ({ value: variant.id, label: `${localize(variant.colorNameAr, variant.colorNameEn)} ${variant.size} · ${variant.sku} (${variant.stockQuantity})`.trim() }))}
      />
      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setOpen(false)}>
          {t('track.keep')}
        </Button>
        <Button disabled={!variantId} loading={swap.isPending} onClick={() => swap.mutate({ itemId, variantId }, { onSuccess: () => { setOpen(false); setVariantId('') } })}>
          {t('admin.actions.apply')}
        </Button>
      </div>
    </div>
  )
}

function RestockForm({ order }: { order: AdminOrder }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const restock = useRestockOrder(order.id)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>()
  const items = order.items.filter((item) => item.fulfillmentType === 'InStock')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const chosen = items.map((item) => ({ orderItemId: item.id, quantity: Number(quantities[item.id] ?? 0) })).filter((entry) => entry.quantity > 0)
    if (chosen.length === 0) return setError(t('admin.returns.pickItems'))
    restock.mutate(chosen, { onSuccess: () => setQuantities({}) })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{t('admin.edit.restock')}</h3>
      <p>{t('admin.edit.restockHint')}</p>
      {(error || restock.error) && <Alert tone="error" title={error ?? errorMessage(restock.error, t)} />}
      {items.map((item) => (
        <Input
          key={item.id}
          label={`${localize(item.productNameAr, item.productNameEn)} · ${item.size}`}
          hint={t('admin.returns.available', { count: item.quantity - item.returnedQuantity })}
          type="number"
          min={0}
          value={quantities[item.id] ?? ''}
          onChange={(event) => { setQuantities((current) => ({ ...current, [item.id]: event.target.value })); setError(undefined) }}
        />
      ))}
      <Button type="submit" loading={restock.isPending}>
        {t('admin.edit.restock')}
      </Button>
    </form>
  )
}
