import { ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CartLine, CartLineList, FreeShipping, useAcknowledgeCartChanges, useCart, useRemoveCartItem, useUpdateCartItem } from '@/features/cart'
import { sizeLabel } from '@/features/catalog'
import { chosenGovernorate, useChosenGovernorate, useGovernorates } from '@/features/shipping'
import { useStoreSettings } from '@/features/store'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Button, ButtonLink, EmptyState, Select, Skeleton } from '@/shared/ui'
import styles from './CartPage.module.scss'

const defaultMaxQuantity = 10

export function CartPage() {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  useDocumentTitle(t('cart.pageTitle'))
  const { data: settings } = useStoreSettings()
  const { data: governorates } = useGovernorates()
  const governorateId = useChosenGovernorate()
  const activeGovernorate = governorates?.some((item) => item.id === governorateId) ? governorateId : null
  const { data: cart, isLoading, error, refetch } = useCart(activeGovernorate)
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const acknowledge = useAcknowledgeCartChanges()
  const failure = update.error ?? remove.error ?? acknowledge.error
  const busy = update.isPending || remove.isPending

  if (isLoading) {
    return (
      <div className={`container ${styles.page}`} aria-busy="true">
        <Skeleton style={{ height: 32, width: 220 }} />
        <Skeleton style={{ height: 240 }} />
      </div>
    )
  }

  if (error || !cart) {
    return (
      <div className={`container ${styles.page}`}>
        <Alert tone="error" title={errorMessage(error, t)} action={<Button size="sm" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <EmptyState icon={ShoppingBag} title={t('cart.emptyTitle')} text={t('cart.emptyText')} action={<ButtonLink to="/shop">{t('cart.browse')}</ButtonLink>} />
      </div>
    )
  }

  const blocked = cart.hasStockIssues || cart.hasPriceChanges
  const shipping = cart.shipping

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>{t('cart.title', { count: cart.itemsCount })}</h1>

      <div className={styles.layout}>
        <div className={styles.lines}>
          {failure && <Alert tone="error" title={errorMessage(failure, t)} />}
          {cart.hasPriceChanges && (
            <Alert
              tone="warning"
              title={t('cart.priceChanged')}
              action={
                <Button size="sm" onClick={() => acknowledge.mutate()} loading={acknowledge.isPending}>
                  {t('cart.acknowledge')}
                </Button>
              }
            />
          )}
          {cart.hasStockIssues && <Alert tone="warning" title={t('cart.stockIssues')} />}
          {cart.freeShipping && <FreeShipping progress={cart.freeShipping} />}
          <CartLineList>
            {cart.items.map((item) => (
              <CartLine
                key={item.variantId}
                item={item}
                maxQuantity={settings?.maxQuantityPerCartItem ?? defaultMaxQuantity}
                sizeLabel={(size) => sizeLabel(size, t)}
                busy={busy}
                onQuantity={(quantity) => update.mutate({ variantId: item.variantId, quantity })}
                onRemove={() => remove.mutate(item.variantId)}
              />
            ))}
          </CartLineList>
          <ButtonLink to="/shop" variant="ghost" className={styles.continue}>
            {t('checkout.continueShopping')}
          </ButtonLink>
        </div>

        <aside className={styles.summary} aria-label={t('cart.summary')}>
          <h2>{t('cart.summary')}</h2>
          <Select
            label={t('checkout.governorate')}
            hint={t('cart.governorateHint')}
            placeholder={t('checkout.chooseGovernorate')}
            value={activeGovernorate ? String(activeGovernorate) : ''}
            onChange={(event) => chosenGovernorate.set(event.target.value ? Number(event.target.value) : null)}
            options={(governorates ?? []).map((item) => ({ value: String(item.id), label: localize(item.nameAr, item.nameEn) }))}
          />
          <dl className={styles.totals}>
            <div>
              <dt>{t('cart.subtotal')}</dt>
              <dd>{formatPiasters(cart.subtotalPiasters, i18n.language)}</dd>
            </div>
            <div>
              <dt>{t('cart.shipping')}</dt>
              <dd>{shipping ? (shipping.isFreeShipping ? t('cart.free') : formatPiasters(shipping.shippingFeePiasters, i18n.language)) : t('cart.chooseToSee')}</dd>
            </div>
            {shipping && (
              <div>
                <dt>{t('cart.delivery')}</dt>
                <dd>{t('product.deliveryDays', { count: shipping.deliveryDays })}</dd>
              </div>
            )}
            <div className={styles.total}>
              <dt>{t('cart.total')}</dt>
              <dd>{formatPiasters(cart.totalPiasters ?? cart.subtotalPiasters, i18n.language)}</dd>
            </div>
          </dl>
          {blocked ? (
            <Button size="lg" fullWidth disabled>
              {t('cart.checkout')}
            </Button>
          ) : (
            <ButtonLink to="/checkout" size="lg" fullWidth>
              {t('cart.checkout')}
            </ButtonLink>
          )}
          <p className={styles.secure}>{t('product.securePayment')}</p>
        </aside>
      </div>
    </div>
  )
}
