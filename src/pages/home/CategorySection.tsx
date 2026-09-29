import { useTranslation } from 'react-i18next'
import { CategoryTile, useCategoryTree } from '@/features/catalog'
import { SectionTitle, Skeleton } from '@/shared/ui'
import styles from './Home.module.scss'

export function CategorySection() {
  const { t } = useTranslation()
  const { data: categories, isLoading } = useCategoryTree()
  const visible = categories?.filter((category) => category.imageUrl) ?? []

  // A store with no categories yet (or a failed request) just doesn't show this block; the products below still work.
  if (!isLoading && visible.length === 0) return null

  return (
    <section className={`container ${styles.section}`} aria-labelledby="home-categories">
      <SectionTitle eyebrow={t('home.categoriesEyebrow')} title={<span id="home-categories">{t('home.categoriesTitle')}</span>} />
      <ul className={styles.categories}>
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <li key={index}>
                <Skeleton style={{ aspectRatio: '1' }} />
              </li>
            ))
          : visible.map((category) => (
              <li key={category.id}>
                <CategoryTile category={category} />
              </li>
            ))}
      </ul>
    </section>
  )
}
