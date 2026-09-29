import { SearchX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/ui'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <div className="container">
      <EmptyState icon={SearchX} title="404" text={t('brand.tagline')} action={<Link to="/">{t('common.home')}</Link>} />
    </div>
  )
}
