import { useState, type FormEvent } from 'react'
import { Boxes } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useAdjustStock, useInventory, useMovements, type InventoryRow } from '@/features/adminInventory'
import { errorMessage, usePermissions } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { useLocalize } from '@/shared/lib/localize'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, Button, EmptyState, Input, Pagination, Skeleton } from '@/shared/ui'
import styles from './Admin.module.scss'

const pageSize = 25

export function AdminInventoryPage() {
  const { t } = useTranslation()
  const localize = useLocalize()
  useDocumentTitle(t('admin.nav.inventory'))
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const lowStockOnly = params.get('low') === '1'
  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [typed, setTyped] = useState(search)
  const [selected, setSelected] = useState<InventoryRow | null>(null)
  const { data, isLoading, error, isPlaceholderData } = useInventory({ lowStockOnly, search, page, pageSize })

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  return (
    <>
      <h1>{t('admin.nav.inventory')}</h1>

      <div className={styles.tabs} role="group" aria-label={t('admin.orders.filterByStatus')}>
        <button type="button" aria-pressed={!lowStockOnly} onClick={() => update({ low: null })}>
          {t('admin.orders.all')}
        </button>
        <button type="button" aria-pressed={lowStockOnly} onClick={() => update({ low: '1' })}>
          {t('admin.inventory.lowOnly')}
        </button>
      </div>

      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          update({ q: typed.trim() || null })
        }}
      >
        <Input label={t('admin.orders.search')} hint={t('admin.inventory.searchHint')} type="search" value={typed} onChange={(event) => setTyped(event.target.value)} />
      </form>

      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 320 }} />}
      {data && data.items.length === 0 && <EmptyState icon={Boxes} title={t('admin.inventory.none')} text={t('admin.orders.noneText')} />}

      {selected && <StockPanel key={selected.variantId} row={selected} canAdjust={can(Permissions.inventoryWrite)} onClose={() => setSelected(null)} />}

      {data && data.items.length > 0 && (
        <div className={styles.tableWrap} aria-busy={isPlaceholderData}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('admin.products.product')}</th>
                <th scope="col">SKU</th>
                <th scope="col">{t('product.size')}</th>
                <th scope="col">{t('admin.products.stock')}</th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.variantId}>
                  <td>
                    <Link to={`/admin/products/${row.productId}`}>{localize(row.productNameAr, row.productNameEn)}</Link>
                    <br />
                    <small>{localize(row.colorNameAr, row.colorNameEn)}</small>
                  </td>
                  <td dir="ltr">{row.sku}</td>
                  <td>{row.size}</td>
                  <td className="num">
                    {row.stockQuantity} {row.isLowStock && <Badge tone={row.stockQuantity === 0 ? 'error' : 'warning'}>{row.stockQuantity === 0 ? t('admin.products.soldOut') : t('admin.inventory.low')}</Badge>}
                  </td>
                  <td>
                    <Button size="sm" variant="secondary" onClick={() => setSelected(row)}>
                      {t('admin.inventory.manage')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && <Pagination page={data.pageNumber} totalPages={data.totalPages} onChange={(next) => update({ page: next > 1 ? String(next) : null })} />}
    </>
  )
}

function StockPanel({ row, canAdjust, onClose }: { row: InventoryRow; canAdjust: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const { data: movements } = useMovements(row.variantId)
  const adjust = useAdjustStock()
  const [change, setChange] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<{ change?: string; reason?: string }>({})
  const format = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })
  const current = adjust.data?.quantityAfter ?? row.stockQuantity

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(change)
    const found = {
      change: Number.isInteger(amount) && amount !== 0 ? undefined : t('admin.inventory.changeInvalid'),
      reason: reason.trim() ? undefined : t('checkout.errors.required'),
    }
    setErrors(found)
    if (found.change || found.reason) return
    adjust.mutate({ variantId: row.variantId, quantityChange: amount, reason: reason.trim() }, { onSuccess: () => { setChange(''); setReason('') } })
  }

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>
          {localize(row.productNameAr, row.productNameEn)} · {row.size} · {row.sku}
        </h2>
        <Button size="sm" variant="secondary" onClick={onClose}>
          {t('common.close')}
        </Button>
      </div>
      <p>{t('admin.inventory.current', { count: current })}</p>

      {canAdjust && (
        <form className={styles.form} onSubmit={submit} noValidate>
          {adjust.error && <Alert tone="error" title={errorMessage(adjust.error, t)} />}
          {adjust.isSuccess && <Alert tone="success" title={t('account.saved')} />}
          <div className={styles.twoCols}>
            <Input label={t('admin.inventory.change')} hint={t('admin.inventory.changeHint')} type="number" value={change} onChange={(event) => { setChange(event.target.value); setErrors((c) => ({ ...c, change: undefined })) }} error={errors.change} required />
            <Input label={t('admin.inventory.reason')} value={reason} onChange={(event) => { setReason(event.target.value); setErrors((c) => ({ ...c, reason: undefined })) }} error={errors.reason} required />
          </div>
          <div>
            <Button type="submit" loading={adjust.isPending}>
              {t('admin.actions.apply')}
            </Button>
          </div>
        </form>
      )}

      <h3>{t('admin.inventory.movements')}</h3>
      <ul className={styles.notes}>
        {movements?.items.map((movement) => (
          <li key={movement.id}>
            <strong>
              {t(`admin.inventory.type.${movement.type}`)} · 
              <span dir="ltr">{movement.quantityChange > 0 ? `+${movement.quantityChange}` : movement.quantityChange}</span> → {movement.quantityAfter}
            </strong>
            {movement.reason && <span>{movement.reason}</span>}
            <small>
              {format.format(asUtc(movement.createdAt))}
              {movement.orderNumber ? ` · ${t('track.orderNumber', { number: movement.orderNumber })}` : ''}
              {movement.userName ? ` · ${movement.userName}` : ''}
            </small>
          </li>
        ))}
      </ul>
    </section>
  )
}
