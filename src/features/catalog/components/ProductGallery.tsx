import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { useLocalize } from '@/shared/lib/localize'
import type { ProductImage } from '../api'
import styles from './ProductGallery.module.scss'
import { responsiveImage, thumbnail } from '@/shared/lib/images'

interface ProductGalleryProps {
  images: ProductImage[]
  name: string
}

// Swipe on a phone, or click a thumbnail. With one photo it is just the photo: no thumbnails, no dots.
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const track = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)

  // The slide that is mostly in view is the active one.
  useEffect(() => {
    const element = track.current
    if (!element || images.length < 2) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActive(Number((visible.target as HTMLElement).dataset.index))
      },
      { root: element, threshold: 0.6 },
    )
    element.querySelectorAll('li').forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [images])

  const goTo = (index: number) => track.current?.children[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })

  if (images.length === 0) return <div className={styles.empty} aria-hidden="true" />

  return (
    <div className={styles.gallery}>
      <ul ref={track} className={styles.track} aria-label={t('product.gallery')}>
        {images.map((image, index) => (
          <li key={image.id} data-index={index} className={styles.slide}>
            <img
              {...responsiveImage(image.url, '(min-width: 992px) 58vw, 100vw')}
              alt={localize(image.altAr, image.altEn) ?? name}
              width={800}
              height={1000}
              fetchPriority={index === 0 ? 'high' : 'auto'}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </li>
        ))}
      </ul>

      {images.length > 1 && (
        <ul className={styles.thumbs}>
          {images.map((image, index) => (
            <li key={image.id}>
              <button
                type="button"
                className={cn(styles.thumb, index === active && styles.thumbActive)}
                onClick={() => goTo(index)}
                aria-label={t('product.photoOf', { current: index + 1, total: images.length })}
                aria-current={index === active}
              >
                <img src={thumbnail(image.url)} alt="" width={72} height={90} loading="lazy" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
