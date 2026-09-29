import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useOrderCounts } from '@/features/adminOrders'
import { useDailyReport } from '@/features/adminReports'
import { errorMessage, usePermissions } from '@/shared/api'
import { formatPiasters } from '@/shared/lib/money'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Input, Skeleton } from '@/shared/ui'
import styles from './Admin.module.scss'

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation()
  useDocumentTitle(t('admin.nav.dashboard'))
  const { can } = usePermissions()
  const [date, setDate] = useState('')
  const { data: report, isLoading, error } = useDailyReport(date)

  if (!can(Permissions.reportsRead)) return <Alert tone="warning" title={t('admin.noAccessText')} />

  const money = (value: number) => formatPiasters(value, i18n.language)

  return (
    <>
      <div className={styles.headRow}>
        <h1>{t('admin.nav.dashboard')}</h1>
        <Input label={t('admin.report.day')} hint={t('admin.report.todayHint')} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </div>

      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 120 }} />}

      {report && (
        <>
          <div className={styles.stats}>
            <Stat label={t('admin.report.ordersPlaced')} value={String(report.ordersPlaced)} />
            <Stat label={t('admin.report.ordersConfirmed')} value={String(report.ordersConfirmed)} />
            <Stat label={t('admin.report.itemsSold')} value={String(report.itemsSold)} />
            <Stat label={t('admin.report.revenue')} value={money(report.revenuePiasters)} />
            <Stat label={t('admin.report.refunded')} value={money(report.refundedPiasters)} />
            <Stat label={t('admin.report.net')} value={money(report.netPiasters)} />
          </div>

          <div className={styles.panel}>
            <h2>{t('admin.report.byStatus')}</h2>
            <dl className={styles.facts}>
              {Object.entries(report.ordersByStatus).map(([status, count]) => (
                <div key={status}>
                  <dt>{t(`track.status.${status}`)}</dt>
                  <dd>{count}</dd>
                </div>
              ))}
              {Object.keys(report.ordersByStatus).length === 0 && <p>{t('admin.report.none')}</p>}
            </dl>
          </div>
        </>
      )}

      {can(Permissions.ordersRead) && <ReviewNotice />}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

// Orders held back for a person to look at (a payment that didn't match, for example) are the most urgent thing on the page.
function ReviewNotice() {
  const { t } = useTranslation()
  const { data } = useOrderCounts()
  if (!data || data.needsReview === 0) return null

  return (
    <Alert
      tone="warning"
      title={t('admin.review.banner', { count: data.needsReview })}
      action={<Link to="/admin/orders?review=1">{t('admin.review.open')}</Link>}
    />
  )
}
