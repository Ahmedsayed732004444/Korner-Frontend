import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { usePermissions } from '@/shared/api'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert } from '@/shared/ui'
import { BannersTab } from './content/BannersTab'
import { PagesTab } from './content/PagesTab'
import styles from './Admin.module.scss'

const tabs = ['banners', 'pages'] as const

export function AdminContentPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.nav.content'))
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const tab = tabs.find((item) => item === params.get('tab')) ?? 'banners'

  if (!can(Permissions.contentRead)) return <Alert tone="warning" title={t('admin.noAccessText')} />

  return (
    <>
      <h1>{t('admin.nav.content')}</h1>
      <div className={styles.tabs} role="group" aria-label={t('admin.nav.content')}>
        {tabs.map((item) => (
          <button key={item} type="button" aria-pressed={tab === item} onClick={() => setParams(item === 'banners' ? {} : { tab: item })}>
            {t(`admin.content.${item}`)}
          </button>
        ))}
      </div>
      {tab === 'banners' ? <BannersTab canWrite={can(Permissions.contentWrite)} /> : <PagesTab canWrite={can(Permissions.contentWrite)} />}
    </>
  )
}
