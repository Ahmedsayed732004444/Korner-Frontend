import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCart } from '../api'
import { useCartDrawer } from '../useCartDrawer'
import styles from './CartButton.module.scss'

export function CartButton() {
  const { t } = useTranslation()
  const { data } = useCart()
  const { open } = useCartDrawer()
  const count = data?.itemsCount ?? 0

  return (
    <button type="button" className={styles.button} onClick={() => open()} aria-label={t('layout.cartWithCount', { count })} aria-haspopup="dialog">
      <ShoppingBag size={24} strokeWidth={1.75} aria-hidden="true" />
      {count > 0 && (
        <span className={styles.count} aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
