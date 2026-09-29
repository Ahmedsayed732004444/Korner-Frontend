import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { usePermissions } from '@/shared/api'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert } from '@/shared/ui'
import { ShippingTab } from './settings/ShippingTab'
import { StoreSettingsTab } from './settings/StoreSettingsTab'
import styles from './Admin.module.scss'

const tabs = ['store', 'shipping'] as const

export function AdminSettingsPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.nav.settings'))
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const tab = tabs.find((item) => item === params.get('tab')) ?? 'store'

  if (!can(Permissions.settingsRead)) return <Alert tone="warning" title={t('admin.noAccessText')} />

  return (
    <>
      <h1>{t('admin.nav.settings')}</h1>
      <div className={styles.tabs} role="group" aria-label={t('admin.nav.settings')}>
        {tabs.map((item) => (
          <button key={item} type="button" aria-pressed={tab === item} onClick={() => setParams(item === 'store' ? {} : { tab: item })}>
            {t(`admin.settings.${item}`)}
          </button>
        ))}
      </div>
      {tab === 'store' ? <StoreSettingsTab canWrite={can(Permissions.settingsWrite)} /> : <ShippingTab canWrite={can(Permissions.settingsWrite)} />}
    </>
  )
}
