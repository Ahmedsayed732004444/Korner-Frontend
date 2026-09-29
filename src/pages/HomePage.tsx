import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { env } from '@/shared/config/env'
import { EmptyState } from '@/shared/ui'

// Placeholder until the home page is built (part 3).
export function HomePage() {
  const { t } = useTranslation()
  return (
    <div className="container" style={{ paddingBlock: 'var(--space-12)' }}>
      <EmptyState
        icon={Sparkles}
        title={t('home.comingSoon')}
        text={t('home.comingSoonText')}
        action={env.isDevelopment && <Link to="/styleguide">{t('home.openStyleGuide')}</Link>}
      />
    </div>
  )
}
