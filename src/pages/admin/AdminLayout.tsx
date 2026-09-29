import { Languages } from 'lucide-react'
import { ShieldX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { signOut } from '@/features/auth'
import { useSession, usePermissions } from '@/shared/api'
import { Permissions } from '@/shared/lib/permissions'
import { Button, EmptyState, Logo } from '@/shared/ui'
import styles from './Admin.module.scss'

const sections = [
  { to: '/admin', end: true, label: 'admin.nav.dashboard', permission: Permissions.reportsRead },
  { to: '/admin/orders', end: false, label: 'admin.nav.orders', permission: Permissions.ordersRead },
  { to: '/admin/returns', end: false, label: 'admin.nav.returns', permission: Permissions.ordersRead },
  { to: '/admin/products', end: false, label: 'admin.nav.products', permission: Permissions.catalogRead },
  { to: '/admin/catalog', end: false, label: 'admin.nav.catalog', permission: Permissions.catalogRead },
  { to: '/admin/content', end: false, label: 'admin.nav.content', permission: Permissions.contentRead },
  { to: '/admin/settings', end: false, label: 'admin.nav.settings', permission: Permissions.settingsRead },
  { to: '/admin/inventory', end: false, label: 'admin.nav.inventory', permission: Permissions.inventoryRead },
]

// The staff area has its own frame (no storefront header or footer). The menu shows only what the staff member may open.
export function AdminLayout() {
  const { t, i18n } = useTranslation()
  const current = useSession()
  const { can, isStaff } = usePermissions()
  const { pathname } = useLocation()

  if (!current) return <Navigate to={`/login?returnTo=${encodeURIComponent(pathname)}`} replace />

  if (!isStaff) {
    return (
      <div className="container">
        <EmptyState icon={ShieldX} title={t('admin.noAccess')} text={t('admin.noAccessText')} action={<Link to="/">{t('common.home')}</Link>} />
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      <header className={styles.top}>
        <Link to="/admin" aria-label={t('admin.title')}>
          <Logo />
        </Link>
        <nav aria-label={t('admin.menu')} className={styles.nav}>
          {sections
            .filter((section) => can(section.permission))
            .map((section) => (
              <NavLink key={section.to} to={section.to} end={section.end}>
                {t(section.label)}
              </NavLink>
            ))}
        </nav>
        <div className={styles.tools}>
          <Link to="/">{t('admin.toStore')}</Link>
          <Button size="sm" variant="ghost" startIcon={<Languages size={16} aria-hidden="true" />} onClick={() => void i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}>
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void signOut()}>
            {t('layout.signOut')}
          </Button>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
