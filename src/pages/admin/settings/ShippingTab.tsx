import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminGovernorates, useSaveGovernorates, type AdminGovernorate } from '@/features/adminSettings'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { parsePounds, piastersToPounds } from '@/shared/lib/money'
import { Alert, Button, Skeleton } from '@/shared/ui'
import styles from '../Admin.module.scss'

interface Row {
  id: number
  isActive: boolean
  fee: string
  days: string
}

export function ShippingTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAdminGovernorates()

  return (
    <section className={styles.panel}>
      <h2>{t('admin.settings.shipping')}</h2>
      <p>{t('admin.settings.shippingHint')}</p>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 240 }} />}
      {data && <GovernoratesTable governorates={data} canWrite={canWrite} />}
    </section>
  )
}

function GovernoratesTable({ governorates, canWrite }: { governorates: AdminGovernorate[]; canWrite: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const save = useSaveGovernorates()
  const [rows, setRows] = useState<Row[]>(() =>
    governorates.map((item) => ({ id: item.id, isActive: item.isActive, fee: piastersToPounds(item.shippingFeePiasters), days: String(item.deliveryDays) })),
  )
  const [invalid, setInvalid] = useState<Set<number>>(new Set())

  const change = (id: number, changes: Partial<Row>) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, ...changes } : row)))
    setInvalid((current) => {
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  const submit = () => {
    const bad = new Set<number>()
    const items = rows.map((row) => {
      const fee = parsePounds(row.fee)
      const days = Number(row.days)
      const daysOk = Number.isInteger(days) && days >= 0 && days <= 60 && (!row.isActive || days > 0)
      if (fee === null || !daysOk) bad.add(row.id)
      return { id: row.id, isActive: row.isActive, shippingFeePiasters: fee ?? 0, deliveryDays: days }
    })
    setInvalid(bad)
    if (bad.size === 0) save.mutate(items)
  }

  return (
    <>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      {save.isSuccess && <Alert tone="success" title={t('account.saved')} />}
      {invalid.size > 0 && <Alert tone="error" title={t('admin.settings.shippingInvalid')} />}
      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th scope="col">{t('checkout.governorate')}</th>
              <th scope="col">{t('admin.settings.active')}</th>
              <th scope="col">{t('admin.settings.fee')}</th>
              <th scope="col">{t('admin.settings.days')}</th>
            </tr>
          </thead>
          <tbody>
            {governorates.map((item) => {
              const row = rows.find((entry) => entry.id === item.id)!
              const bad = invalid.has(item.id)
              return (
                <tr key={item.id}>
                  <td>{localize(item.nameAr, item.nameEn)}</td>
                  <td>
                    <input type="checkbox" checked={row.isActive} disabled={!canWrite} aria-label={`${localize(item.nameAr, item.nameEn)} ${t('admin.settings.active')}`} onChange={(event) => change(item.id, { isActive: event.target.checked })} />
                  </td>
                  <td>
                    <input className={styles.cellInput} inputMode="decimal" disabled={!canWrite} aria-invalid={bad || undefined} aria-label={`${localize(item.nameAr, item.nameEn)} ${t('admin.settings.fee')}`} value={row.fee} onChange={(event) => change(item.id, { fee: event.target.value })} />
                  </td>
                  <td>
                    <input className={styles.cellInput} type="number" min={0} max={60} disabled={!canWrite} aria-invalid={bad || undefined} aria-label={`${localize(item.nameAr, item.nameEn)} ${t('admin.settings.days')}`} value={row.days} onChange={(event) => change(item.id, { days: event.target.value })} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {canWrite && (
        <div>
          <Button onClick={submit} loading={save.isPending}>
            {t('account.save')}
          </Button>
        </div>
      )}
    </>
  )
}
