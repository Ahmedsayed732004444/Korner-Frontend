import { CreditCard, RotateCcw, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStoreSettings } from '@/features/store'
import styles from './Home.module.scss'

// The three doubts that stop a first purchase, answered before the first product.
export function TrustStrip() {
  const { t } = useTranslation()
  const { data: settings } = useStoreSettings()

  const items = [
    { icon: CreditCard, title: t('home.trust.payTitle'), text: t('home.trust.payText') },
    { icon: RotateCcw, title: t('home.trust.returnTitle'), text: t('home.trust.returnText', { days: settings?.returnWindowDays ?? 14 }) },
    { icon: Truck, title: t('home.trust.deliveryTitle'), text: t('home.trust.deliveryText') },
  ]

  return (
    <section className={`container ${styles.trust}`} aria-label={t('home.trust.label')}>
      <ul>
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Icon size={28} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <h2>{title}</h2>
              <p>{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
