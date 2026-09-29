import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAddVariant,
  useColorOptions,
  useDeleteVariant,
  useUpdateVariant,
  type AdminProduct,
  type AdminVariant,
  type Fulfillment,
  type VariantInput,
} from '@/features/adminCatalog'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters, parsePounds, piastersToPounds } from '@/shared/lib/money'
import { Alert, Badge, Button, Checkbox, Input, Select } from '@/shared/ui'
import styles from '../Admin.module.scss'

export function VariantsSection({ product }: { product: AdminProduct }) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const remove = useDeleteVariant(product.id)
  // undefined = form closed, null = adding, a variant = editing it.
  const [editing, setEditing] = useState<AdminVariant | null | undefined>(undefined)

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.products.variantsTitle')}</h2>
        {editing === undefined && <Button onClick={() => setEditing(null)}>{t('admin.products.addVariant')}</Button>}
      </div>
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}

      {editing !== undefined && <VariantForm key={editing?.id ?? 'new'} product={product} variant={editing} onDone={() => setEditing(undefined)} />}

      {product.variants.length === 0 && editing === undefined && <p>{t('admin.products.noVariants')}</p>}

      {product.variants.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">SKU</th>
                <th scope="col">{t('product.color')}</th>
                <th scope="col">{t('product.size')}</th>
                <th scope="col">{t('admin.products.price')}</th>
                <th scope="col">{t('admin.products.stock')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {product.variants.map((variant) => (
                <tr key={variant.id}>
                  <td dir="ltr">
                    {variant.sku} {!variant.isActive && <Badge tone="warning">{t('admin.products.inactive')}</Badge>}
                  </td>
                  <td>{localize(variant.colorNameAr, variant.colorNameEn) || '—'}</td>
                  <td>{variant.size}</td>
                  <td className="num">
                    {formatPiasters(variant.pricePiasters, i18n.language)}
                    {variant.compareAtPricePiasters ? <s> {formatPiasters(variant.compareAtPricePiasters, i18n.language)}</s> : null}
                  </td>
                  <td className="num">{variant.fulfillmentType === 'OnDemand' ? t('admin.products.onDemand', { days: variant.leadTimeDays }) : variant.stockQuantity}</td>
                  <td>
                    <span className={styles.actions}>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(variant)}>
                        {t('account.edit')}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => remove.mutate(variant.id)} loading={remove.isPending && remove.variables === variant.id}>
                        {t('account.delete')}
                      </Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function VariantForm({ product, variant, onDone }: { product: AdminProduct; variant: AdminVariant | null; onDone: () => void }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: colors } = useColorOptions()
  const add = useAddVariant(product.id)
  const update = useUpdateVariant(product.id)
  const saving = add.isPending || update.isPending
  const error = add.error ?? update.error

  const [colorId, setColorId] = useState(variant?.colorId ?? '')
  const [size, setSize] = useState(variant?.size ?? '')
  const [sku, setSku] = useState(variant?.sku ?? '')
  const [price, setPrice] = useState(variant ? piastersToPounds(variant.pricePiasters) : '')
  const [compareAt, setCompareAt] = useState(variant?.compareAtPricePiasters ? piastersToPounds(variant.compareAtPricePiasters) : '')
  const [fulfillment, setFulfillment] = useState<Fulfillment>(variant?.fulfillmentType ?? 'InStock')
  const [stock, setStock] = useState('0')
  const [leadDays, setLeadDays] = useState(String(variant?.leadTimeDays ?? 0))
  const [threshold, setThreshold] = useState(variant?.lowStockThreshold != null ? String(variant.lowStockThreshold) : '')
  const [sortOrder, setSortOrder] = useState(String(variant?.sortOrder ?? 0))
  const [isActive, setIsActive] = useState(variant?.isActive ?? true)
  const [errors, setErrors] = useState<Partial<Record<'size' | 'sku' | 'price' | 'compareAt' | 'lead', string>>>({})

  const clear = (field: keyof typeof errors) => setErrors((current) => ({ ...current, [field]: undefined }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const invalid = t('admin.products.invalidAmount')
    const found: typeof errors = {}
    const pricePiasters = parsePounds(price)
    const comparePiasters = compareAt.trim() ? parsePounds(compareAt) : null
    const lead = Number(leadDays)
    if (!size.trim()) found.size = required
    if (!sku.trim()) found.sku = required
    if (pricePiasters === null || pricePiasters <= 0) found.price = invalid
    if (compareAt.trim() && (comparePiasters === null || (pricePiasters !== null && comparePiasters <= pricePiasters))) found.compareAt = t('admin.products.compareAtHint')
    if (fulfillment === 'OnDemand' && (!Number.isInteger(lead) || lead < 1)) found.lead = t('admin.products.leadRequired')
    setErrors(found)
    if (Object.keys(found).length > 0 || pricePiasters === null) return

    const input: VariantInput = {
      colorId: colorId || null,
      size: size.trim(),
      sortOrder: Number(sortOrder) || 0,
      sku: sku.trim().toUpperCase(),
      pricePiasters,
      compareAtPricePiasters: comparePiasters,
      fulfillmentType: fulfillment,
      leadTimeDays: fulfillment === 'OnDemand' ? lead : 0,
      lowStockThreshold: threshold.trim() ? Number(threshold) : null,
      isActive,
    }
    if (variant) update.mutate({ id: variant.id, input }, { onSuccess: onDone })
    else add.mutate({ ...input, initialStock: fulfillment === 'InStock' ? Math.max(0, Number(stock) || 0) : 0 }, { onSuccess: onDone })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{variant ? t('admin.products.editVariant') : t('admin.products.addVariant')}</h3>
      {error != null && <Alert tone="error" title={errorMessage(error, t)} />}
      <div className={styles.twoCols}>
        <Select
          label={t('product.color')}
          optional
          placeholder={t('admin.products.none_')}
          value={colorId}
          onChange={(event) => setColorId(event.target.value)}
          options={(colors ?? []).map((item) => ({ value: item.id, label: localize(item.nameAr, item.nameEn) }))}
        />
        <Input label={t('product.size')} hint={t('admin.products.sizeHint')} value={size} onChange={(event) => { setSize(event.target.value); clear('size') }} error={errors.size} required />
        <Input label="SKU" dir="ltr" value={sku} onChange={(event) => { setSku(event.target.value); clear('sku') }} error={errors.sku} required />
        <Input label={t('admin.products.priceEgp')} inputMode="decimal" value={price} onChange={(event) => { setPrice(event.target.value); clear('price') }} error={errors.price} required />
        <Input label={t('admin.products.compareAt')} inputMode="decimal" optional value={compareAt} onChange={(event) => { setCompareAt(event.target.value); clear('compareAt') }} error={errors.compareAt} />
        <Select
          label={t('admin.products.fulfillment')}
          value={fulfillment}
          onChange={(event) => setFulfillment(event.target.value as Fulfillment)}
          options={[
            { value: 'InStock', label: t('admin.products.fulfillments.InStock') },
            { value: 'OnDemand', label: t('admin.products.fulfillments.OnDemand') },
          ]}
        />
        {fulfillment === 'InStock' && !variant && <Input label={t('admin.products.initialStock')} type="number" min={0} value={stock} onChange={(event) => setStock(event.target.value)} />}
        {fulfillment === 'InStock' && (
          <Input label={t('admin.products.threshold')} hint={t('admin.products.thresholdHint')} type="number" min={0} optional value={threshold} onChange={(event) => setThreshold(event.target.value)} />
        )}
        {fulfillment === 'OnDemand' && (
          <Input label={t('admin.products.leadDays')} type="number" min={1} value={leadDays} onChange={(event) => { setLeadDays(event.target.value); clear('lead') }} error={errors.lead} required />
        )}
        <Input label={t('admin.products.sortOrder')} type="number" optional value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
      </div>
      <Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} label={t('admin.products.active')} />
      <div className={styles.actions}>
        <Button type="submit" loading={saving}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('account.cancelEdit')}
        </Button>
      </div>
    </form>
  )
}
