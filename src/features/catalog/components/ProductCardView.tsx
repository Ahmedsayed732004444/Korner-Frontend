import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { useLocalize } from '@/shared/lib/localize'
import { Badge, Price } from '@/shared/ui'
import type { ProductCard } from '../api'
import { discountPercent } from '../discount'
import styles from './ProductCardView.module.scss'

const maxColorDots = 4

// One link covers the whole card (through the title's ::after), so keyboard users get one stop per product, not three.
export function ProductCardView({ product }: { product: ProductCard }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const name = localize(product.nameAr, product.nameEn)
  const percent = product.isOnSale ? discountPercent(product.minPricePiasters, product.compareAtPricePiasters) : null
  const extraColors = product.colorHexCodes.length - maxColorDots

  return (
    <article className={cn(styles.card, !product.inStock && styles.soldOut)}>
      <div className={styles.media}>
        {product.imageUrl && <img src={product.imageUrl} alt="" loading="lazy" decoding="async" width={520} height={650} />}
        <div className={styles.badges}>
          {!product.inStock ? (
            <Badge tone="dark">{t('badge.soldOut')}</Badge>
          ) : (
            percent && <Badge tone="sale">{t('badge.percentOff', { percent })}</Badge>
          )}
        </div>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>
          <Link to={`/p/${localize(product.slugAr, product.slugEn)}`} className={styles.link}>
            {name}
          </Link>
        </h3>
        <Price amount={product.minPricePiasters} compareAt={product.isOnSale ? product.compareAtPricePiasters : null} size="md" />
        {product.colorHexCodes.length > 1 && (
          <ul className={styles.colors} aria-label={t('catalog.colorsAvailable', { count: product.colorHexCodes.length })}>
            {product.colorHexCodes.slice(0, maxColorDots).map((hex) => (
              <li key={hex} style={{ background: hex }} />
            ))}
            {extraColors > 0 && <li className={styles.moreColors}>+{extraColors}</li>}
          </ul>
        )}
      </div>
    </article>
  )
}
