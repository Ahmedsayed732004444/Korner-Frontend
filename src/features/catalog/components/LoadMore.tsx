import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui'
import styles from './LoadMore.module.scss'

interface LoadMoreProps {
  shown: number
  total: number
  hasMore: boolean
  loading: boolean
  /** How many batches have been loaded so far; after `autoBatches` the shopper clicks, so the footer stays reachable. */
  batches: number
  autoBatches?: number
  onLoad: () => void
}

// Dynamic paging: the next products arrive by themselves as the shopper nears the end of the list (the easiest on a
// phone). A progress bar says how far along they are, and a button is always there for keyboards and screen readers.
export function LoadMore({ shown, total, hasMore, loading, batches, autoBatches = 3, onLoad }: LoadMoreProps) {
  const { t } = useTranslation()
  const sentinel = useRef<HTMLDivElement>(null)
  const auto = hasMore && batches < autoBatches

  useEffect(() => {
    const target = sentinel.current
    if (!auto || loading || !target) return

    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && onLoad(), { rootMargin: '600px 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [auto, loading, onLoad])

  if (total === 0) return null
  const percent = Math.min(100, Math.round((shown / total) * 100))

  return (
    <div className={styles.more} ref={sentinel}>
      <p className={styles.count}>{t('catalog.shownOf', { shown, total })}</p>
      <div className={styles.bar} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={t('catalog.shownOf', { shown, total })}>
        <span style={{ width: `${percent}%` }} />
      </div>
      {hasMore && (
        <Button variant="secondary" onClick={onLoad} loading={loading}>
          {t('catalog.showMore')}
        </Button>
      )}
    </div>
  )
}
