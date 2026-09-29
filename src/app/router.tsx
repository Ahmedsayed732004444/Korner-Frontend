import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { env } from '@/shared/config/env'
import { CartPage } from '@/pages/CartPage'
import { CheckoutPage } from '@/pages/CheckoutPage'
import { CheckoutResultPage } from '@/pages/CheckoutResultPage'
import { ConfirmEmailPage } from '@/pages/ConfirmEmailPage'
import { ContentPage } from '@/pages/ContentPage'
import { ForgetPasswordPage } from '@/pages/ForgetPasswordPage'
import { LoginPage } from '@/pages/LoginPage'
import { OAuthCallbackPage } from '@/pages/OAuthCallbackPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { TrackOrderPage } from '@/pages/TrackOrderPage'
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
  'account/*',
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
      { path: 'orders/track', element: <TrackOrderPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'auth/emailConfirmation', element: <ConfirmEmailPage /> },
      { path: 'auth/forgetPassword', element: <ForgetPasswordPage /> },
      { path: 'oauth/callback', element: <OAuthCallbackPage /> },
      { path: 'pages/:type', element: <ContentPage /> },
      { path: 'shop', element: <ShopPage /> },
      { path: 'search', element: <SearchPage /> },
      ...plannedRoutes.map((path) => ({ path, element: <PlaceholderPage /> })),
      ...developmentRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
