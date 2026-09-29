import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { usePermissions } from '@/shared/api'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert } from '@/shared/ui'
import { RolesTab } from './access/RolesTab'
import { UsersTab } from './access/UsersTab'
import styles from './Admin.module.scss'

const tabs = ['users', 'roles'] as const

export function AdminAccessPage() {
  const { t } = useTranslation()
  useDocumentTitle(t('admin.nav.access'))
  const { can } = usePermissions()
  const [params, setParams] = useSearchParams()
  const allowed = tabs.filter((item) => can(item === 'users' ? Permissions.usersRead : Permissions.rolesRead))
  const tab = allowed.find((item) => item === params.get('tab')) ?? allowed[0]

  if (!tab) return <Alert tone="warning" title={t('admin.noAccessText')} />

  return (
    <>
      <h1>{t('admin.nav.access')}</h1>
      <div className={styles.tabs} role="group" aria-label={t('admin.nav.access')}>
        {allowed.map((item) => (
          <button key={item} type="button" aria-pressed={tab === item} onClick={() => setParams(item === allowed[0] ? {} : { tab: item })}>
            {t(`admin.access.${item}`)}
          </button>
        ))}
      </div>
      {tab === 'users' ? <UsersTab canWrite={can(Permissions.usersWrite)} /> : <RolesTab canWrite={can(Permissions.rolesWrite)} />}
    </>
  )
}
