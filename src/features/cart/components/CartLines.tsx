import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { Badge, Price, QuantityInput } from '@/shared/ui'
import type { CartItem, FreeShippingProgress } from '../api'
import styles from './CartLines.module.scss'
import { thumbnail } from '@/shared/lib/images'

export function CartLineList({ children }: { children: ReactNode }) {
  return <ul className={styles.lines}>{children}</ul>
}

export function FreeShipping({ progress }: { progress: FreeShippingProgress }) {
  const { t, i18n } = useTranslation()

  const percent = progress.isReached ? 100 : Math.min(100, Math.round(((progress.thresholdPiasters - progress.amountRemainingPiasters) / progress.thresholdPiasters) * 100))

  return (
    <div className={styles.progress}>
      <p>
        {progress.isReached
          ? t('cart.freeShippingReached')
          : t('cart.freeShippingRemaining', { amount: formatPiasters(progress.amountRemainingPiasters, i18n.language) })}
      </p>
      <div className={styles.bar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('cart.freeShippingLabel')}>
        <span style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export interface CartLineProps {
  item: CartItem
  maxQuantity: number
  sizeLabel: (size: string) => string
  busy: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
  onNavigate?: () => void
}

export function CartLine({ item, maxQuantity, sizeLabel, busy, onQuantity, onRemove, onNavigate }: CartLineProps) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const name = localize(item.productNameAr, item.productNameEn)
  const color = localize(item.colorNameAr, item.colorNameEn)
  const unavailable = item.issues.includes('Unavailable') || item.issues.includes('OutOfStock')
  const limit = item.availableQuantity !== null ? Math.max(1, Math.min(maxQuantity, item.availableQuantity)) : maxQuantity

  return (
    <li className={styles.line}>
      {item.imageUrl && <img src={thumbnail(item.imageUrl)} alt="" width={72} height={90} loading="lazy" />}
      <div className={styles.lineBody}>
        <Link to={`/p/${localize(item.productSlugAr, item.productSlugEn)}`} className={styles.lineName} onClick={onNavigate}>
          {name}
        </Link>
        <p className={styles.meta}>
          {[color, sizeLabel(item.size)].filter(Boolean).join(' · ')}
          {item.fulfillmentType === 'OnDemand' && ` · ${t('cart.madeToOrder', { days: item.leadTimeDays })}`}
        </p>
        <div className={styles.issues}>
          {item.issues.includes('PriceChanged') && <Badge tone="warning">{t('cart.issues.priceChanged')}</Badge>}
          {item.issues.includes('InsufficientStock') && <Badge tone="warning">{t('cart.issues.fewLeft', { count: item.availableQuantity ?? 0 })}</Badge>}
          {unavailable && <Badge tone="error">{t('cart.issues.unavailable')}</Badge>}
        </div>
        <div className={styles.lineFooter}>
          {unavailable ? (
            <span />
          ) : (
            <QuantityInput value={item.quantity} onChange={onQuantity} max={limit} disabled={busy} label={t('cart.quantityOf', { name })} />
          )}
          <Price amount={item.lineTotalPiasters} size="sm" />
        </div>
      </div>
      <button type="button" className={styles.remove} onClick={onRemove} disabled={busy} aria-label={t('cart.remove', { name })}>
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </li>
  )
}
