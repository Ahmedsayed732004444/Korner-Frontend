import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { StoreSettings } from '@/features/store'
import { formatPiasters } from '@/shared/lib/money'
import styles from './Layout.module.scss'

// The template's black announcement bar, with the two promises that remove the most doubt before buying.
export function TopBar({ settings }: { settings: StoreSettings | undefined }) {
  const { t, i18n } = useTranslation()
  const threshold = settings?.freeShippingThresholdPiasters

  const message = threshold
    ? t('layout.freeShippingOver', { amount: formatPiasters(threshold, i18n.language) })
    : t('layout.returnsWithin', { days: settings?.returnWindowDays ?? 14 })

  return (
    <div className={styles.topBar}>
      <div className={`container ${styles.topBarInner}`}>
        <p>{message}</p>
        <nav aria-label={t('layout.quickLinks')} className={styles.topBarLinks}>
          <Link to="/orders/track">{t('layout.trackOrder')}</Link>
          <Link to="/pages/faq">{t('layout.help')}</Link>
        </nav>
      </div>
    </div>
  )
}
