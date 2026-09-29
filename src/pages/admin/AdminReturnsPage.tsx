import { useState } from 'react'
import { Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { useReturns, type ReturnStatus } from '@/features/adminReturns'
import { errorMessage } from '@/shared/api'
import { asUtc } from '@/shared/lib/dates'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, EmptyState, Input, Pagination, Skeleton } from '@/shared/ui'
import { returnTone } from './returnTone'
import styles from './Admin.module.scss'

const statuses: ReturnStatus[] = ['Requested', 'Received', 'Refunded', 'Rejected']
const pageSize = 20

export function AdminReturnsPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('admin.nav.returns'))
  const [params, setParams] = useSearchParams()
  const status = statuses.find((item) => item === params.get('status')) ?? null
  const search = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [typed, setTyped] = useState(search)
  const { data, isLoading, error, isPlaceholderData } = useReturns({ status, search, page, pageSize })
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium' })

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
      <h1>{t('admin.nav.returns')}</h1>
      <div className={styles.tabs} role="group" aria-label={t('admin.orders.filterByStatus')}>
        <button type="button" aria-pressed={!status} onClick={() => update({ status: null })}>
          {t('admin.orders.all')}
        </button>
        {statuses.map((item) => (
          <button key={item} type="button" aria-pressed={status === item} onClick={() => update({ status: item })}>
            {t(`admin.returns.status.${item}`)}
          </button>
        ))}
      </div>

      <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); update({ q: typed.trim() || null }) }}>
        <Input label={t('admin.orders.search')} hint={t('admin.orders.searchHint')} type="search" value={typed} onChange={(event) => setTyped(event.target.value)} />
      </form>

      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 240 }} />}
      {data && data.items.length === 0 && <EmptyState icon={Undo2} title={t('admin.returns.none')} text={t('admin.returns.noneText')} />}

      {data && data.items.length > 0 && (
        <div className={styles.tableWrap} aria-busy={isPlaceholderData}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('admin.orders.number')}</th>
                <th scope="col">{t('admin.orders.customer')}</th>
                <th scope="col">{t('admin.orders.status')}</th>
                <th scope="col">{t('admin.returns.channel')}</th>
                <th scope="col">{t('admin.orders.createdAt')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.id}>
                  <td className="num">
                    <Link to={`/admin/returns/${row.id}`}>{row.orderNumber}</Link>
                  </td>
                  <td>{row.customerName}</td>
                  <td>
                    <Badge tone={returnTone(row.status)}>{t(`admin.returns.status.${row.status}`)}</Badge> {row.isStoreFault && <Badge tone="warning">{t('admin.returns.storeFaultShort')}</Badge>}
                  </td>
                  <td>{row.channel}</td>
                  <td className="num">{date.format(asUtc(row.createdAt))}</td>
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
