import { forwardRef } from 'react'
import { RotateCcw, ShieldCheck, ShoppingBag, Truck, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, QuantityInput, SizePicker, SwatchPicker } from '@/shared/ui'
import { deliveryDays, sizeLabel, type ProductPage, type Selection } from '@/features/catalog'
import styles from './PurchasePanel.module.scss'

export type BuyMode = 'add' | 'buy'

interface PurchasePanelProps {
  product: ProductPage
  selection: Selection
  quantity: number
  maxQuantity: number
  returnWindowDays: number
  /** Which action is running right now, so only that button shows its spinner. */
  busy: BuyMode | null
  error: unknown
  showSizeError: boolean
  onColor: (colorId: string) => void
  onSize: (size: string) => void
  onQuantity: (quantity: number) => void
  onSubmit: (mode: BuyMode) => void
}

// The size group is forwarded so a click on "Add to cart" without a size can bring the shopper straight to it.
export const PurchasePanel = forwardRef<HTMLDivElement, PurchasePanelProps>(function PurchasePanel(
  { product, selection, quantity, maxQuantity, returnWindowDays, busy, error, showSizeError, onColor, onSize, onQuantity, onSubmit },
  sizeGroup,
) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const days = deliveryDays(product, selection.variant)
  const soldOut = !product.inStock

  return (
    <div className={styles.panel}>
      {product.colors.length > 0 && (
        <SwatchPicker
          legend={`${t('product.color')}: `}
          value={selection.colorId ?? undefined}
          onChange={onColor}
          options={selection.colors.map((color) => ({ value: color.id, label: localize(color.nameAr, color.nameEn), hex: color.hexCode, available: color.available }))}
        />
      )}

      <div ref={sizeGroup} className={styles.sizes}>
        {selection.sizes.length === 1 && selection.size !== null ? (
          <p className={styles.singleSize}>
            <span>{t('product.size')}:</span> {sizeLabel(selection.sizes[0].size, t)}
          </p>
        ) : (
          <SizePicker
            legend={t('product.size')}
            value={selection.size ?? undefined}
            onChange={onSize}
            options={selection.sizes.map((option) => ({ value: option.size, label: sizeLabel(option.size, t), available: option.available }))}
          />
        )}
        {showSizeError && (
          <p role="alert" className={styles.sizeError}>
            {t('product.chooseSize')}
          </p>
        )}
      </div>

      {selection.variant?.fulfillmentType === 'OnDemand' && (
        <Alert tone="info" title={t('product.madeToOrder', { days: selection.variant.leadTimeDays })}>
          {t('product.madeToOrderText')}
        </Alert>
      )}

      {soldOut ? (
        <Alert tone="warning" title={t('product.soldOut')}>
          {t('product.soldOutText')}
        </Alert>
      ) : (
        <div className={styles.actions} data-buy-actions>
          <div className={styles.quantityRow}>
            <QuantityInput value={quantity} onChange={onQuantity} max={maxQuantity} disabled={busy !== null} />
            {days && (
              <p className={styles.delivery}>
                <Truck size={18} aria-hidden="true" />
                {days.min === days.max ? t('product.deliveryDays', { count: days.min }) : t('product.deliveryRange', { min: days.min, max: days.max })}
              </p>
            )}
          </div>
          <Button size="lg" fullWidth variant="accent" startIcon={<Zap size={18} aria-hidden="true" />} loading={busy === 'buy'} disabled={busy === 'add'} onClick={() => onSubmit('buy')}>
            {t('product.buyNow')}
          </Button>
          <Button size="lg" fullWidth variant="secondary" startIcon={<ShoppingBag size={18} aria-hidden="true" />} loading={busy === 'add'} disabled={busy === 'buy'} onClick={() => onSubmit('add')}>
            {t('product.addToCart')}
          </Button>
        </div>
      )}

      {error !== null && error !== undefined && <Alert tone="error" title={errorMessage(error, t)} />}

      <ul className={styles.assurances}>
        <li>
          <RotateCcw size={18} aria-hidden="true" /> {t('product.returns', { days: returnWindowDays })}
        </li>
        <li>
          <ShieldCheck size={18} aria-hidden="true" /> {t('product.securePayment')}
        </li>
      </ul>
    </div>
  )
})
