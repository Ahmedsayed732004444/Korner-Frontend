import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { useLocalize } from '@/shared/lib/localize'
import { ButtonLink, Skeleton } from '@/shared/ui'
import { useBanners } from '../api'
import styles from './HeroSlider.module.scss'

// Swipes on phones, arrows and dots elsewhere. No autoplay: moving content is hard to read and can't be paused by everyone.
export function HeroSlider() {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: banners, isLoading } = useBanners()
  const track = useRef<HTMLUListElement>(null)
  const [active, setActive] = useState(0)

  // The slide that is mostly in view is the active one.
  useEffect(() => {
    const element = track.current
    if (!element || !banners?.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting)
        if (visible) setActive(Number((visible.target as HTMLElement).dataset.index))
      },
      { root: element, threshold: 0.6 },
    )
    element.querySelectorAll('li').forEach((slide) => observer.observe(slide))
    return () => observer.disconnect()
  }, [banners])

  // scrollIntoView follows the writing direction, so "next" works the same in Arabic and English.
  const goTo = (index: number) =>
    track.current?.children[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })

  if (isLoading) return <Skeleton className={styles.placeholder} />
  if (!banners?.length) return null

  return (
    <section className={styles.hero} aria-roledescription="carousel" aria-label={t('home.heroLabel')}>
      <ul ref={track} className={styles.track}>
        {banners.map((banner, index) => {
          const title = localize(banner.titleAr, banner.titleEn)
          return (
            <li key={banner.id} data-index={index} className={styles.slide}>
              <img
                src={localize(banner.imageUrlAr, banner.imageUrlEn)}
                alt=""
                className={styles.image}
                width={1920}
                height={801}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                loading={index === 0 ? 'eager' : 'lazy'}
              />
              <div className={cn('container', styles.textWrap)}>
                <div className={styles.text}>
                  <span className={styles.eyebrow}>{t('home.heroEyebrow')}</span>
                  {title && <h2 className={styles.title}>{title}</h2>}
                  <p className={styles.subtitle}>{t('brand.tagline')}</p>
                  {banner.linkUrl && (
                    <ButtonLink to={banner.linkUrl} size="lg" endIcon={<ArrowRight size={18} aria-hidden="true" className="flip-rtl" />}>
                      {t('home.shopNow')}
                      {title && <span className="visually-hidden"> — {title}</span>}
                    </ButtonLink>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {banners.length > 1 && (
        <>
          <button type="button" className={cn(styles.arrow, styles.prev)} onClick={() => goTo(Math.max(active - 1, 0))} disabled={active === 0} aria-label={t('home.previousSlide')}>
            <ChevronLeft size={24} aria-hidden="true" className="flip-rtl" />
          </button>
          <button type="button" className={cn(styles.arrow, styles.next)} onClick={() => goTo(Math.min(active + 1, banners.length - 1))} disabled={active === banners.length - 1} aria-label={t('home.nextSlide')}>
            <ChevronRight size={24} aria-hidden="true" className="flip-rtl" />
          </button>
          <div className={styles.dots}>
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={cn(styles.dot, index === active && styles.dotActive)}
                onClick={() => goTo(index)}
                aria-label={t('home.slideOf', { current: index + 1, total: banners.length })}
                aria-current={index === active}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
