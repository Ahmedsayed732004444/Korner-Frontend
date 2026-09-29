import { useTranslation } from 'react-i18next'
import type { StoreSettings } from '@/features/store'
import { useLocalize } from '@/shared/lib/localize'
import { Alert } from '@/shared/ui'

// ADM-09: browsing keeps working, only buying is paused; the store's own message explains why.
export function MaintenanceBanner({ settings }: { settings: StoreSettings | undefined }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  if (!settings?.isMaintenanceMode) return null

  return (
    <div className="container" style={{ paddingTop: 'var(--space-4)' }}>
      <Alert tone="info" title={t('layout.maintenanceTitle')}>
        {localize(settings.maintenanceMessageAr, settings.maintenanceMessageEn)}
      </Alert>
    </div>
  )
}
