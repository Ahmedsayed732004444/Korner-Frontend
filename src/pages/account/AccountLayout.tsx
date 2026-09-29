import { useTranslation } from 'react-i18next'
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from '@/features/auth'
import { useSession } from '@/shared/api'
import { Button } from '@/shared/ui'
import styles from './Account.module.scss'

// Every /account page is behind this: a visitor is sent to sign in and brought back here afterwards.
export function AccountLayout() {
  const { t } = useTranslation()
  const current = useSession()
  const { pathname } = useLocation()

  if (!current) return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname)}`} replace />

  return (
    <div className={`container ${styles.layout}`}>
      <aside className={styles.side}>
        <p className={styles.greeting}>{t('account.hello', { name: current.user.firstName })}</p>
        <nav aria-label={t('account.menu')}>
          <NavLink to="/account" end>
            {t('account.profile')}
          </NavLink>
          <NavLink to="/account/orders">{t('account.orders')}</NavLink>
          <NavLink to="/account/addresses">{t('account.addresses')}</NavLink>
        </nav>
        <Button variant="secondary" onClick={() => void signOut()}>
          {t('layout.signOut')}
        </Button>
      </aside>
      <section className={styles.content}>
        <Outlet />
      </section>
    </div>
  )
}
