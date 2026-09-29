import { Trash2, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { Alert, Badge, ButtonLink, Drawer, EmptyState, Price, QuantityInput, Skeleton } from '@/shared/ui'
import { useCart, useRemoveCartItem, useUpdateCartItem, type CartItem, type FreeShippingProgress } from '../api'
import { useCartDrawer } from '../useCartDrawer'
import styles from './CartDrawer.module.scss'

interface CartDrawerProps {
  /** From the store's policy; the API refuses more than this per item. */
  maxQuantity: number
  /** Turns a size such as "One Size" into text in the shopper's language. */
  sizeLabel: (size: string) => string
}

// The mini-cart: opens from the header and right after "Add to cart", so buying never needs a page of its own.
export function CartDrawer({ maxQuantity, sizeLabel }: CartDrawerProps) {
  const { t, i18n } = useTranslation()
  const { isOpen, justAdded, close } = useCartDrawer()
  const { data: cart, isLoading } = useCart()
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const failure = update.error ?? remove.error
  const items = cart?.items ?? []

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title={t('cart.title', { count: cart?.itemsCount ?? 0 })}
      side="end"
      footer={
        items.length > 0 && (
          <div className={styles.footer}>
            <dl className={styles.subtotal}>
              <dt>{t('cart.subtotal')}</dt>
              <dd>{formatPiasters(cart!.subtotalPiasters, i18n.language)}</dd>
            </dl>
            <p className={styles.note}>{t('cart.shippingNote')}</p>
            <ButtonLink to="/checkout" size="lg" fullWidth>
              {t('cart.checkout')}
            </ButtonLink>
            <Link to="/cart" className={styles.viewCart} onClick={close}>
              {t('cart.viewCart')}
            </Link>
          </div>
        )
      }
    >
      <div className={styles.content}>
        {justAdded && (
          <Alert tone="success" title={t('cart.added')} />
        )}
        {failure && <Alert tone="error" title={errorMessage(failure, t)} />}
        {cart?.hasPriceChanges && <Alert tone="warning" title={t('cart.priceChanged')} />}

        {isLoading ? (
          <Skeleton style={{ height: 96 }} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={t('cart.emptyTitle')}
            text={t('cart.emptyText')}
            action={
              <ButtonLink to="/shop" onClick={close}>
                {t('cart.browse')}
              </ButtonLink>
            }
          />
        ) : (
          <>
            {cart?.freeShipping && <FreeShipping progress={cart.freeShipping} />}
            <ul className={styles.lines}>
              {items.map((item) => (
                <Line
                  key={item.variantId}
                  item={item}
                  maxQuantity={maxQuantity}
                  sizeLabel={sizeLabel}
                  busy={update.isPending || remove.isPending}
                  onQuantity={(quantity) => update.mutate({ variantId: item.variantId, quantity })}
                  onRemove={() => remove.mutate(item.variantId)}
                  onNavigate={close}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </Drawer>
  )
}

function FreeShipping({ progress }: { progress: FreeShippingProgress }) {
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

interface LineProps {
  item: CartItem
  maxQuantity: number
  sizeLabel: (size: string) => string
  busy: boolean
  onQuantity: (quantity: number) => void
  onRemove: () => void
  onNavigate: () => void
}

function Line({ item, maxQuantity, sizeLabel, busy, onQuantity, onRemove, onNavigate }: LineProps) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const name = localize(item.productNameAr, item.productNameEn)
  const color = localize(item.colorNameAr, item.colorNameEn)
  const unavailable = item.issues.includes('Unavailable') || item.issues.includes('OutOfStock')
  const limit = item.availableQuantity !== null ? Math.max(1, Math.min(maxQuantity, item.availableQuantity)) : maxQuantity

  return (
    <li className={styles.line}>
      {item.imageUrl && <img src={item.imageUrl} alt="" width={72} height={90} loading="lazy" />}
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
