import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

// Header, footer and the mobile menu come in part 2; every page already renders inside <main>.
export function RootLayout() {
  const { t } = useTranslation()
  return (
    <>
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
    </>
  )
}
