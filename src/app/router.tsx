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
import { AccountAddressesPage } from '@/pages/account/AccountAddressesPage'
import { AccountLayout } from '@/pages/account/AccountLayout'
import { AccountOrderPage } from '@/pages/account/AccountOrderPage'
import { AccountOrdersPage } from '@/pages/account/AccountOrdersPage'
import { AccountProfilePage } from '@/pages/account/AccountProfilePage'
import { CategoryPage } from '@/pages/CategoryPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProductPage } from '@/pages/ProductPage'
import { SearchPage } from '@/pages/SearchPage'
import { ShopPage } from '@/pages/ShopPage'
import { SiteLayout } from './layout/SiteLayout'

const developmentRoutes: RouteObject[] = env.isDevelopment
  ? [{ path: 'styleguide', lazy: async () => ({ Component: (await import('@/pages/StyleGuidePage')).StyleGuidePage }) }]
  : []

// The staff area is loaded only when someone opens it, so shoppers never download it.
const adminRoutes: RouteObject = {
  path: 'admin',
  lazy: async () => ({ Component: (await import('@/pages/admin/AdminLayout')).AdminLayout }),
  children: [
    { index: true, lazy: async () => ({ Component: (await import('@/pages/admin/AdminDashboardPage')).AdminDashboardPage }) },
    { path: 'orders', lazy: async () => ({ Component: (await import('@/pages/admin/AdminOrdersPage')).AdminOrdersPage }) },
    { path: 'orders/:id', lazy: async () => ({ Component: (await import('@/pages/admin/AdminOrderPage')).AdminOrderPage }) },
    { path: 'returns', lazy: async () => ({ Component: (await import('@/pages/admin/AdminReturnsPage')).AdminReturnsPage }) },
    { path: 'returns/:id', lazy: async () => ({ Component: (await import('@/pages/admin/AdminReturnPage')).AdminReturnPage }) },
    { path: 'products', lazy: async () => ({ Component: (await import('@/pages/admin/AdminProductsPage')).AdminProductsPage }) },
    { path: 'products/new', lazy: async () => ({ Component: (await import('@/pages/admin/AdminProductPage')).AdminProductPage }) },
    { path: 'products/:id', lazy: async () => ({ Component: (await import('@/pages/admin/AdminProductPage')).AdminProductPage }) },
    { path: 'catalog', lazy: async () => ({ Component: (await import('@/pages/admin/AdminLookupsPage')).AdminLookupsPage }) },
    { path: 'inventory', lazy: async () => ({ Component: (await import('@/pages/admin/AdminInventoryPage')).AdminInventoryPage }) },
  ],
}

export const router = createBrowserRouter([
  adminRoutes,
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
      {
        path: 'account',
        element: <AccountLayout />,
        children: [
          { index: true, element: <AccountProfilePage /> },
          { path: 'orders', element: <AccountOrdersPage /> },
          { path: 'orders/:number', element: <AccountOrderPage /> },
          { path: 'addresses', element: <AccountAddressesPage /> },
        ],
      },
      { path: 'shop', element: <ShopPage /> },
      { path: 'search', element: <SearchPage /> },
      ...developmentRoutes,
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
