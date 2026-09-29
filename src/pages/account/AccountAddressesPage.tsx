import { useState, type FormEvent } from 'react'
import { MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAddresses, useDeleteAddress, useSaveAddress, type SaveAddressInput, type SavedAddress } from '@/features/account'
import { isEgyptMobile, normalizeDigits } from '@/features/checkout'
import { useGovernorates } from '@/features/shipping'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, Button, Checkbox, EmptyState, Input, Select, Skeleton } from '@/shared/ui'
import styles from './Account.module.scss'

export function AccountAddressesPage() {
  const { t } = useTranslation()
  const localize = useLocalize()
  useDocumentTitle(t('account.addresses'))
  const { data: addresses, isLoading, error } = useAddresses()
  const remove = useDeleteAddress()
  // undefined = form closed, null = adding a new address, an address = editing it.
  const [editing, setEditing] = useState<SavedAddress | null | undefined>(undefined)

  return (
    <>
      <h1>{t('account.addresses')}</h1>
      {isLoading && <Skeleton style={{ height: 160 }} />}
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}

      {editing !== undefined && <AddressForm key={editing?.id ?? 'new'} address={editing} onDone={() => setEditing(undefined)} />}

      {addresses && addresses.length === 0 && editing === undefined && (
        <EmptyState icon={MapPin} title={t('account.noAddresses')} text={t('account.noAddressesText')} />
      )}

      <ul className={styles.list}>
        {addresses?.map((item) => (
          <li key={item.id} className={styles.address}>
            <strong>
              {item.recipientName} {item.isDefault && <Badge tone="info">{t('account.default')}</Badge>}
            </strong>
            <address>
              <span dir="ltr">{item.phone}</span>
              <br />
              {localize(item.governorateNameAr, item.governorateNameEn)}، {item.address.area}، {item.address.street}، {item.address.building}
            </address>
            <div className={styles.actions}>
              <Button size="sm" variant="secondary" onClick={() => setEditing(item)}>
                {t('account.edit')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => remove.mutate(item.id)} loading={remove.isPending && remove.variables === item.id}>
                {t('account.delete')}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {editing === undefined && (
        <div>
          <Button onClick={() => setEditing(null)}>{t('account.addAddress')}</Button>
        </div>
      )}
    </>
  )
}

interface Values {
  recipientName: string
  phone: string
  governorateId: string
  area: string
  street: string
  building: string
  floor: string
  apartment: string
  landmark: string
  isDefault: boolean
}

type Field = 'recipientName' | 'phone' | 'governorateId' | 'area' | 'street' | 'building'

function AddressForm({ address, onDone }: { address: SavedAddress | null; onDone: () => void }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: governorates } = useGovernorates()
  const save = useSaveAddress()
  const [values, setValues] = useState<Values>({
    recipientName: address?.recipientName ?? '',
    phone: address?.phone ?? '',
    governorateId: address ? String(address.governorateId) : '',
    area: address?.address.area ?? '',
    street: address?.address.street ?? '',
    building: address?.address.building ?? '',
    floor: address?.address.floor ?? '',
    apartment: address?.address.apartment ?? '',
    landmark: address?.address.landmark ?? '',
    isDefault: address?.isDefault ?? false,
  })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})

  const set = (field: keyof Values) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const found: Partial<Record<Field, string>> = {}
    if (!values.recipientName.trim()) found.recipientName = required
    if (!isEgyptMobile(values.phone)) found.phone = t('checkout.errors.phone')
    if (!values.governorateId) found.governorateId = required
    if (!values.area.trim()) found.area = required
    if (!values.street.trim()) found.street = required
    if (!values.building.trim()) found.building = required
    setErrors(found)
    if (Object.keys(found).length > 0) return

    const input: SaveAddressInput = {
      recipientName: values.recipientName.trim(),
      phone: normalizeDigits(values.phone).trim(),
      governorateId: Number(values.governorateId),
      address: {
        area: values.area.trim(),
        street: values.street.trim(),
        building: values.building.trim(),
        floor: values.floor.trim() || null,
        apartment: values.apartment.trim() || null,
        landmark: values.landmark.trim() || null,
      },
      isDefault: values.isDefault,
    }
    save.mutate({ id: address?.id ?? null, input }, { onSuccess: onDone })
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h2>{address ? t('account.editAddress') : t('account.addAddress')}</h2>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <Input label={t('account.recipient')} value={values.recipientName} onChange={set('recipientName')} error={errors.recipientName} autoComplete="name" required />
      <Input label={t('checkout.phone')} type="tel" inputMode="numeric" value={values.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" required />
      <Select
        label={t('checkout.governorate')}
        placeholder={t('checkout.chooseGovernorate')}
        value={values.governorateId}
        onChange={set('governorateId')}
        options={(governorates ?? []).map((item) => ({ value: String(item.id), label: localize(item.nameAr, item.nameEn) }))}
        error={errors.governorateId}
        required
      />
      <Input label={t('checkout.area')} value={values.area} onChange={set('area')} error={errors.area} required />
      <Input label={t('checkout.street')} value={values.street} onChange={set('street')} error={errors.street} required />
      <div className={styles.row}>
        <Input label={t('checkout.building')} value={values.building} onChange={set('building')} error={errors.building} required />
        <Input label={t('checkout.floor')} value={values.floor} onChange={set('floor')} optional />
        <Input label={t('checkout.apartment')} value={values.apartment} onChange={set('apartment')} optional />
      </div>
      <Input label={t('checkout.landmark')} value={values.landmark} onChange={set('landmark')} optional />
      <Checkbox checked={values.isDefault} onChange={(event) => setValues((current) => ({ ...current, isDefault: event.target.checked }))} label={t('account.makeDefault')} />
      <div className={styles.actions}>
        <Button type="submit" loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('account.cancelEdit')}
        </Button>
      </div>
    </form>
  )
}
