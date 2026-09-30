import { useRef, useState } from 'react'
import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAddToCart, useCartDrawer } from '@/features/cart'
import {
  ProductGallery,
  ProductGrid,
  discountPercent,
  imagesForColor,
  resolveSelection,
  useProduct,
  useProducts,
  type ProductPage as ProductData,
} from '@/features/catalog'
import { useStoreSettings } from '@/features/store'
import { ApiError } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, Breadcrumb, Button, EmptyState, Price, SectionTitle, Skeleton } from '@/shared/ui'
import { PurchasePanel, type BuyMode } from './product/PurchasePanel'
import { ProductTabs } from './product/ProductTabs'
import { StickyBuyBar } from './product/StickyBuyBar'
import styles from './product/ProductPage.module.scss'

const defaultMaxQuantity = 10
const returnsFallbackDays = 14
const relatedCount = 4

export function ProductPage() {
  const { t } = useTranslation()
  const { slug = '' } = useParams()
  const { data: product, isLoading, error, refetch } = useProduct(slug)
  const localize = useLocalize()
  useDocumentTitle(product ? localize(product.nameAr, product.nameEn) : undefined)

  if (isLoading) return <ProductSkeleton />

  if (error instanceof ApiError && error.status === 404) {
    return (
      <div className="container">
        <EmptyState icon={SearchX} title={t('product.notFound')} text={t('product.notFoundText')} action={<Link to="/shop">{t('home.viewAll')}</Link>} />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        <Alert tone="error" title={t('errors.generic')} action={<Button size="sm" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      </div>
    )
  }

  // Keyed by product so choosing "M" on one product never carries over to the next.
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }: { product: ProductData }) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const navigate = useNavigate()
  const { data: settings } = useStoreSettings()
  const { open: openCart } = useCartDrawer()
  const add = useAddToCart()

  const [chosen, setChosen] = useState<{ colorId: string | null; size: string | null }>({ colorId: null, size: null })
  const [quantity, setQuantity] = useState(1)
  const [busy, setBusy] = useState<BuyMode | null>(null)
  const [showSizeError, setShowSizeError] = useState(false)
  const sizeGroup = useRef<HTMLDivElement>(null)

  const selection = resolveSelection(product, chosen)
  const images = imagesForColor(product, selection.colorId)
  const name = localize(product.nameAr, product.nameEn)
  const maxQuantity = settings?.maxQuantityPerCartItem ?? defaultMaxQuantity
  const returnDays = settings?.returnWindowDays ?? returnsFallbackDays
  const percentOff = discountPercent(selection.price, selection.compareAtPrice)

  const submit = async (mode: BuyMode) => {
    if (!selection.variant) {
      // The shopper is taken to the missing choice instead of being told off by a disabled button.
      setShowSizeError(true)
      sizeGroup.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      sizeGroup.current?.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus({ preventScroll: true })
      return
    }

    setShowSizeError(false)
    setBusy(mode)
    try {
      await add.mutateAsync({ variantId: selection.variant.id, quantity })
      if (mode === 'buy') navigate('/checkout')
      else openCart({ justAdded: true })
    } catch {
      // The error is on the mutation and shown under the buttons.
    } finally {
      setBusy(null)
    }
  }

  const parent = product.parentCategory
  const categoryLink = (item: { slugAr: string; slugEn: string }) => `/c/${localize(item.slugAr, item.slugEn)}`

  return (
    <div className={`container ${styles.page}`}>
      <Breadcrumb
        items={[
          { label: t('common.home'), to: '/' },
          ...(parent ? [{ label: localize(parent.nameAr, parent.nameEn), to: categoryLink(parent) }] : []),
          { label: localize(product.category.nameAr, product.category.nameEn), to: categoryLink(product.category) },
          { label: name },
        ]}
      />

      <div className={styles.layout}>
        <ProductGallery key={selection.colorId ?? 'all'} images={images} name={name} />

        <div className={styles.info}>
          <div className={styles.heading}>
            {product.brand && <p className={styles.brand}>{localize(product.brand.nameAr, product.brand.nameEn)}</p>}
            <h1 className={styles.title}>{name}</h1>
            <div className={styles.priceRow}>
              {selection.isFromPrice && <span className={styles.from}>{t('product.from')}</span>}
              <Price amount={selection.price} compareAt={selection.compareAtPrice} size="lg" />
              {percentOff && <Badge tone="sale">{t('badge.percentOff', { percent: percentOff })}</Badge>}
            </div>
            {selection.compareAtPrice !== null && selection.compareAtPrice > selection.price && (
              <p className="text-positive">{t('product.youSave', { amount: formatPiasters(selection.compareAtPrice - selection.price, i18n.language) })}</p>
            )}
          </div>

          <PurchasePanel
            ref={sizeGroup}
            product={product}
            selection={selection}
            quantity={quantity}
            maxQuantity={maxQuantity}
            returnWindowDays={returnDays}
            busy={busy}
            error={add.error}
            showSizeError={showSizeError}
            onColor={(colorId) => setChosen({ colorId, size: null })}
            onSize={(size) => {
              setChosen((current) => ({ ...current, size }))
              setShowSizeError(false)
            }}
            onQuantity={setQuantity}
            onSubmit={(mode) => void submit(mode)}
          />
        </div>
      </div>

      <ProductTabs product={product} returnWindowDays={returnDays} />
      <Related product={product} />

      <StickyBuyBar selection={selection} soldOut={!product.inStock} busy={busy === 'add'} onAdd={() => void submit('add')} />
    </div>
  )
}

// More from the same category, so the shopper who doesn't want this one has somewhere to go.
function Related({ product }: { product: ProductData }) {
  const { t } = useTranslation()
  const { data, isLoading, error, refetch } = useProducts({ category: product.category.slugEn, pageSize: relatedCount + 1, sort: '-publishedAt' })
  const items = data?.items.filter((item) => item.id !== product.id).slice(0, relatedCount)

  if (!isLoading && !error && items?.length === 0) return null

  return (
    <section className={styles.related} aria-labelledby="related-title">
      <SectionTitle title={<span id="related-title">{t('product.related')}</span>} />
      <ProductGrid products={items} isLoading={isLoading} error={error} onRetry={() => void refetch()} skeletonCount={relatedCount} />
    </section>
  )
}

function ProductSkeleton() {
  return (
    <div className={`container ${styles.page}`} aria-busy="true">
      <div className={styles.layout}>
        <Skeleton style={{ aspectRatio: '4 / 5' }} />
        <div className={styles.info}>
          <Skeleton style={{ height: 36, width: '70%' }} />
          <Skeleton style={{ height: 28, width: '30%' }} />
          <Skeleton style={{ height: 120 }} />
          <Skeleton style={{ height: 52 }} />
        </div>
      </div>
    </div>
  )
}
