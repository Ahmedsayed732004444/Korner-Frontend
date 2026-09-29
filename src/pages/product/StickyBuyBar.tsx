import { useEffect, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Price } from '@/shared/ui'
import type { Selection } from '@/features/catalog'
import styles from './StickyBuyBar.module.scss'

interface StickyBuyBarProps {
  selection: Selection
  soldOut: boolean
  busy: boolean
  onAdd: () => void
}

// Phones only: once the real buttons have scrolled out of view, the price and "Add to cart" stay in reach at the bottom.
export function StickyBuyBar({ selection, soldOut, busy, onAdd }: StickyBuyBarProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const anchor = document.querySelector('[data-buy-actions]')
    if (!anchor) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
    observer.observe(anchor)
    return () => observer.disconnect()
  }, [soldOut])

  if (soldOut || !visible) return null

  return (
    <div className={styles.bar}>
      <div className={styles.price}>
        {selection.isFromPrice && <span className={styles.from}>{t('product.from')}</span>}
        <Price amount={selection.price} compareAt={selection.compareAtPrice} size="md" />
      </div>
      <Button loading={busy} startIcon={<ShoppingBag size={18} aria-hidden="true" />} onClick={onAdd}>
        {t('product.addToCart')}
      </Button>
    </div>
  )
}
