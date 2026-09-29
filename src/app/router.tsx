import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { env } from '@/shared/config/env'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { SiteLayout } from './layout/SiteLayout'

const developmentRoutes: RouteObject[] = env.isDevelopment
  ? [{ path: 'styleguide', lazy: async () => ({ Component: (await import('@/pages/StyleGuidePage')).StyleGuidePage }) }]
  : []

// Routes from docs/DESIGN.md section 1; the ones the backend puts in emails and redirects must keep these exact paths.
const plannedRoutes = [
  'c/:slug', 'search', 'p/:slug', 'cart', 'checkout', 'checkout/result', 'orders/track',
  'login', 'register', 'auth/emailConfirmation', 'auth/forgetPassword', 'oauth/callback', 'account/*', 'pages/:type',
]

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      ...plannedRoutes.map((path) => ({ path, element: <PlaceholderPage /> })),
      ...developmentRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
