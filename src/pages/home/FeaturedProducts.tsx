import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProductGrid, useProducts, type ProductListParams } from '@/features/catalog'
import { ButtonLink, SectionTitle, Tabs, tabPanelProps } from '@/shared/ui'
import styles from './Home.module.scss'

const perTab = 8

// Each tab is its own request, and only the open tab is fetched.
const tabs: Record<string, ProductListParams> = {
  bestSellers: { sort: '-salesCount,-publishedAt', pageSize: perTab },
  newArrivals: { sort: '-publishedAt', pageSize: perTab },
  onSale: { onSaleOnly: true, sort: '-publishedAt', pageSize: perTab },
}

export function FeaturedProducts() {
  const { t } = useTranslation()
  const [active, setActive] = useState('bestSellers')
  const { data, isLoading, error, refetch } = useProducts(tabs[active])

  return (
    <section className={`container ${styles.section}`} aria-labelledby="home-products">
      <SectionTitle eyebrow={t('home.productsEyebrow')} title={<span id="home-products">{t('home.productsTitle')}</span>} />
      <Tabs
        idPrefix="home"
        label={t('home.productsTitle')}
        value={active}
        onChange={setActive}
        items={Object.keys(tabs).map((id) => ({ id, label: t(`home.tabs.${id}`) }))}
      />
      <div {...tabPanelProps('home', active)}>
        <ProductGrid products={data?.items} isLoading={isLoading} error={error} onRetry={() => void refetch()} skeletonCount={perTab} />
      </div>
      <div className={styles.viewAll}>
        <ButtonLink to="/shop" variant="secondary" size="lg" endIcon={<ArrowRight size={18} aria-hidden="true" className="flip-rtl" />}>
          {t('home.viewAll')}
        </ButtonLink>
      </div>
    </section>
  )
}
