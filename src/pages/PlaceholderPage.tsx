import { Hammer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/shared/ui'

// Routes that exist in the plan but whose page is built in a later part.
export function PlaceholderPage() {
  const { t } = useTranslation()
  return (
    <div className="container">
      <EmptyState icon={Hammer} title={t('placeholder.title')} text={t('placeholder.text')} action={<Link to="/">{t('common.home')}</Link>} />
    </div>
  )
}
