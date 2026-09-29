import { FileX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router-dom'
import { useContentPage } from '@/features/content'
import { ApiError, errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Button, EmptyState, Skeleton } from '@/shared/ui'
import styles from './ContentPage.module.scss'

// Terms, privacy, shipping, returns, about and FAQ. The text is written in the admin and shown as plain text.
export function ContentPage() {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { type = '' } = useParams()
  const { data, isLoading, error, refetch } = useContentPage(type)
  useDocumentTitle(data ? localize(data.titleAr, data.titleEn) : undefined)

  if (isLoading) {
    return (
      <div className={`container ${styles.page}`} aria-busy="true">
        <Skeleton style={{ height: 36, width: 260 }} />
        <Skeleton style={{ height: 200 }} />
      </div>
    )
  }

  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return (
      <div className="container">
        <EmptyState icon={FileX} title={t('content.notFound')} text={t('content.notFoundText')} action={<Link to="/">{t('common.home')}</Link>} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={`container ${styles.page}`}>
        <Alert tone="error" title={errorMessage(error, t)} action={<Button size="sm" onClick={() => void refetch()}>{t('common.retry')}</Button>} />
      </div>
    )
  }

  return (
    <article className={`container ${styles.page}`}>
      <h1>{localize(data.titleAr, data.titleEn)}</h1>
      <div className={styles.body}>{localize(data.bodyAr, data.bodyEn)}</div>
    </article>
  )
}
