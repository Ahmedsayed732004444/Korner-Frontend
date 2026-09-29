import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { errorMessage } from '@/shared/api'
import { formatPiasters } from '@/shared/lib/money'
import { Alert, ButtonLink, Drawer, EmptyState, Skeleton } from '@/shared/ui'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../api'
import { CartLine, CartLineList, FreeShipping } from './CartLines'
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
            <CartLineList>
              {items.map((item) => (
                <CartLine
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
            </CartLineList>
          </>
        )}
      </div>
    </Drawer>
  )
}
