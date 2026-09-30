import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/600.css'
import '@fontsource/cairo/700.css'
import '@fontsource/nunito-sans/400.css'
import '@fontsource/nunito-sans/600.css'
import '@fontsource/nunito-sans/700.css'
import '@/shared/styles/index.scss'
import { initI18n } from '@/shared/i18n'
import { App } from '@/app/App'
import { queryClient } from '@/app/queryClient'
import { categoryTreeQuery } from '@/features/catalog'
import { bannersQuery } from '@/features/content'
import { storeSettingsQuery } from '@/features/store'
import { env } from '@/shared/config/env'

// The data every page needs (and the home banners) is requested while the code starts up, not after the first render.
void queryClient.prefetchQuery(storeSettingsQuery)
void queryClient.prefetchQuery(categoryTreeQuery)
if (window.location.pathname === '/') void queryClient.prefetchQuery(bannersQuery)

// Opens the connection to the API (and its images) early when it lives on another domain.
if (/^https?:\/\//.test(env.apiUrl)) {
  const link = Object.assign(document.createElement('link'), { rel: 'preconnect', href: new URL(env.apiUrl).origin, crossOrigin: 'anonymous' })
  document.head.append(link)
}

// The page's own language is loaded before the first render, so no untranslated keys ever flash.
void initI18n().then(() =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  ),
)
