import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCartSummary } from '../api'
import styles from './CartButton.module.scss'

export function CartButton() {
  const { t } = useTranslation()
  const { data } = useCartSummary()
  const count = data?.itemsCount ?? 0

  return (
    <Link to="/cart" className={styles.button} aria-label={t('layout.cartWithCount', { count })}>
      <ShoppingBag size={24} strokeWidth={1.75} aria-hidden="true" />
      {count > 0 && (
        <span className={styles.count} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}
