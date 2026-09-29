import { LayoutDashboard, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePermissions, useSession } from '@/shared/api'
import styles from './AccountButton.module.scss'

export function AccountButton() {
  const { t } = useTranslation()
  const current = useSession()
  const { isStaff } = usePermissions()

  return (
    <>
      {isStaff && (
        <Link to="/admin" className={styles.button} aria-label={t('admin.title')}>
          <LayoutDashboard size={24} strokeWidth={1.75} aria-hidden="true" />
          <span className={styles.label}>{t('admin.title')}</span>
        </Link>
      )}
      <Link to={current ? '/account' : '/login'} className={styles.button} aria-label={current ? t('layout.account') : t('layout.signIn')}>
        <UserRound size={24} strokeWidth={1.75} aria-hidden="true" />
        <span className={styles.label}>{current ? current.user.firstName || t('layout.account') : t('layout.signIn')}</span>
      </Link>
    </>
  )
}
