import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { GoogleSignInPrompt } from '@/features/auth'
import { mergeGuestCartIntoAccount } from '@/features/cart'
import { useStoreSettings } from '@/features/store'
import { Footer } from './Footer'
import { Header } from './Header'
import { MaintenanceBanner } from './MaintenanceBanner'
import { TopBar } from './TopBar'

// Pages where a sign-in prompt would interrupt buying or signing in.
const noPromptPaths = ['/checkout', '/login', '/register', '/oauth', '/auth']

export function SiteLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const { data: settings } = useStoreSettings()

  // Composition point between features: auth doesn't know about carts, so the layout joins them after sign-in.
  const handleSignedIn = useCallback(async () => {
    try {
      await mergeGuestCartIntoAccount()
    } finally {
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
    }
  }, [queryClient])

  return (
    <>
      <a href="#main" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <TopBar settings={settings} />
      <Header />
      <MaintenanceBanner settings={settings} />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer settings={settings} />
      <GoogleSignInPrompt
        clientId={settings?.googleClientId}
        enabled={!noPromptPaths.some((path) => pathname.startsWith(path))}
        onSignedIn={handleSignedIn}
      />
    </>
  )
}
