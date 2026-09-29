import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { env } from '@/shared/config/env'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { CheckoutResultPage } from '@/pages/CheckoutResultPage'
import { CategoryPage } from '@/pages/CategoryPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProductPage } from '@/pages/ProductPage'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { SearchPage } from '@/pages/SearchPage'
import { ShopPage } from '@/pages/ShopPage'
import { SiteLayout } from './layout/SiteLayout'

const developmentRoutes: RouteObject[] = env.isDevelopment
  ? [{ path: 'styleguide', lazy: async () => ({ Component: (await import('@/pages/StyleGuidePage')).StyleGuidePage }) }]
  : []

// Routes from docs/DESIGN.md section 1 whose page is still to come. The ones the backend puts in emails and redirects
// must keep these exact paths.
const plannedRoutes = [
  'orders/track',
  'login', 'register', 'auth/emailConfirmation', 'auth/forgetPassword', 'oauth/callback', 'account/*', 'pages/:type',
]

export const router = createBrowserRouter([
  {
    element: <SiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'c/:slug', element: <CategoryPage /> },
      { path: 'p/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'checkout/result', element: <CheckoutResultPage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'search', element: <SearchPage /> },
      ...plannedRoutes.map((path) => ({ path, element: <PlaceholderPage /> })),
      ...developmentRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
