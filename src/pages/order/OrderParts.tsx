import { useTranslation } from 'react-i18next'
import { sizeLabel } from '@/features/catalog'
import { asUtc } from '@/shared/lib/dates'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import type { OrderStatus } from '@/shared/lib/orderStatus'
import styles from './OrderParts.module.scss'
import { thumbnail } from '@/shared/lib/images'

interface OrderItemView {
  productNameAr: string
  productNameEn: string
  size: string
  colorNameAr: string | null
  colorNameEn: string | null
  imageUrl: string | null
  quantity: number
  lineTotalPiasters: number
}

export function OrderItems({ items }: { items: OrderItemView[] }) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()

  return (
    <ul className={styles.items} aria-label={t('track.items')}>
      {items.map((item, index) => (
        <li key={index}>
          {item.imageUrl ? <img src={thumbnail(item.imageUrl)} alt="" width={48} height={60} loading="lazy" /> : <span />}
          <span>
            {localize(item.productNameAr, item.productNameEn)}
            <small>
              {[localize(item.colorNameAr, item.colorNameEn), sizeLabel(item.size, t)].filter(Boolean).join(' · ')} × {item.quantity}
            </small>
          </span>
          <span>{formatPiasters(item.lineTotalPiasters, i18n.language)}</span>
        </li>
      ))}
    </ul>
  )
}

export function OrderHistory({ history }: { history: { status: OrderStatus; at: string }[] }) {
  const { t, i18n } = useTranslation()
  const format = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <ol className={styles.history} aria-label={t('track.history')}>
      {[...history].reverse().map((step) => (
        <li key={`${step.status}-${step.at}`}>
          <strong>{t(`track.status.${step.status}`)}</strong>
          <time dateTime={step.at}>{format.format(asUtc(step.at))}</time>
        </li>
      ))}
    </ol>
  )
}
