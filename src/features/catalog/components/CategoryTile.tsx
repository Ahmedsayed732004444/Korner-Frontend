import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useLocalize } from '@/shared/lib/localize'
import type { CategoryNode } from '../api'
import styles from './CategoryTile.module.scss'
import { responsiveImage } from '@/shared/lib/images'

// The template's "Clothing collection / SHOP NOW" block. The whole tile is one link.
export function CategoryTile({ category }: { category: CategoryNode }) {
  const { t } = useTranslation()
  const localize = useLocalize()

  return (
    <article className={styles.tile}>
      <div className={styles.media}>
        {category.imageUrl && <img {...responsiveImage(category.imageUrl, '(min-width: 768px) 25vw, 50vw')} alt="" loading="lazy" decoding="async" width={520} height={520} />}
      </div>
      <h3 className={styles.name}>
        <Link to={`/c/${localize(category.slugAr, category.slugEn)}`} className={styles.link}>
          {localize(category.nameAr, category.nameEn)}
        </Link>
      </h3>
      <span className={styles.cta} aria-hidden="true">
        {t('home.shopNow')}
      </span>
    </article>
  )
}
