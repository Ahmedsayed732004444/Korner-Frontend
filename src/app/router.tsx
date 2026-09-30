import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { env } from '@/shared/config/env'
import { loadStaffText } from '@/shared/i18n'
import { HomePage } from '@/pages/HomePage'
import { SiteLayout } from './layout/SiteLayout'

// Every page except the home page is its own file, downloaded the first time someone opens it. On a phone that means
// the first screen only parses the code it needs.
const page = (load: () => Promise<Record<string, unknown>>, name: string) => async () => ({ Component: (await load())[name] as React.ComponentType })

const developmentRoutes: RouteObject[] = env.isDevelopment ? [{ path: 'styleguide', lazy: async () => ({ Component: (await Promise.all([import('@/pages/StyleGuidePage'), loadStaffText()]))[0].StyleGuidePage }) }] : []

const adminRoutes: RouteObject = {
  path: 'admin',
  lazy: async () => {
    const [layout] = await Promise.all([import('@/pages/admin/AdminLayout'), loadStaffText()])
    return { Component: layout.AdminLayout }
  },
  children: [
    { index: true, lazy: page(() => import('@/pages/admin/AdminDashboardPage'), 'AdminDashboardPage') },
    { path: 'orders', lazy: page(() => import('@/pages/admin/AdminOrdersPage'), 'AdminOrdersPage') },
    { path: 'orders/:id', lazy: page(() => import('@/pages/admin/AdminOrderPage'), 'AdminOrderPage') },
    { path: 'returns', lazy: page(() => import('@/pages/admin/AdminReturnsPage'), 'AdminReturnsPage') },
    { path: 'returns/:id', lazy: page(() => import('@/pages/admin/AdminReturnPage'), 'AdminReturnPage') },
    { path: 'products', lazy: page(() => import('@/pages/admin/AdminProductsPage'), 'AdminProductsPage') },
    { path: 'products/new', lazy: page(() => import('@/pages/admin/AdminProductPage'), 'AdminProductPage') },
    { path: 'products/:id', lazy: page(() => import('@/pages/admin/AdminProductPage'), 'AdminProductPage') },
    { path: 'catalog', lazy: page(() => import('@/pages/admin/AdminLookupsPage'), 'AdminLookupsPage') },
    { path: 'content', lazy: page(() => import('@/pages/admin/AdminContentPage'), 'AdminContentPage') },
    { path: 'settings', lazy: page(() => import('@/pages/admin/AdminSettingsPage'), 'AdminSettingsPage') },
    { path: 'access', lazy: page(() => import('@/pages/admin/AdminAccessPage'), 'AdminAccessPage') },
    { path: 'inventory', lazy: page(() => import('@/pages/admin/AdminInventoryPage'), 'AdminInventoryPage') },
  ],
}

export const router = createBrowserRouter([
  { ...adminRoutes, hydrateFallbackElement: <div className="page-placeholder" /> },
  {
    element: <SiteLayout />,
    hydrateFallbackElement: <div className="page-placeholder" />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'c/:slug', lazy: page(() => import('@/pages/CategoryPage'), 'CategoryPage') },
      { path: 'p/:slug', lazy: page(() => import('@/pages/ProductPage'), 'ProductPage') },
      { path: 'shop', lazy: page(() => import('@/pages/ShopPage'), 'ShopPage') },
      { path: 'search', lazy: page(() => import('@/pages/SearchPage'), 'SearchPage') },
      { path: 'cart', lazy: page(() => import('@/pages/CartPage'), 'CartPage') },
      { path: 'checkout', lazy: page(() => import('@/pages/CheckoutPage'), 'CheckoutPage') },
      { path: 'checkout/result', lazy: page(() => import('@/pages/CheckoutResultPage'), 'CheckoutResultPage') },
      { path: 'orders/track', lazy: page(() => import('@/pages/TrackOrderPage'), 'TrackOrderPage') },
      { path: 'login', lazy: page(() => import('@/pages/LoginPage'), 'LoginPage') },
      { path: 'register', lazy: page(() => import('@/pages/RegisterPage'), 'RegisterPage') },
      { path: 'auth/emailConfirmation', lazy: page(() => import('@/pages/ConfirmEmailPage'), 'ConfirmEmailPage') },
      { path: 'auth/forgetPassword', lazy: page(() => import('@/pages/ForgetPasswordPage'), 'ForgetPasswordPage') },
      { path: 'oauth/callback', lazy: page(() => import('@/pages/OAuthCallbackPage'), 'OAuthCallbackPage') },
      { path: 'pages/:type', lazy: page(() => import('@/pages/ContentPage'), 'ContentPage') },
      {
        path: 'account',
        lazy: page(() => import('@/pages/account/AccountLayout'), 'AccountLayout'),
        children: [
          { index: true, lazy: page(() => import('@/pages/account/AccountProfilePage'), 'AccountProfilePage') },
          { path: 'orders', lazy: page(() => import('@/pages/account/AccountOrdersPage'), 'AccountOrdersPage') },
          { path: 'orders/:number', lazy: page(() => import('@/pages/account/AccountOrderPage'), 'AccountOrderPage') },
          { path: 'addresses', lazy: page(() => import('@/pages/account/AccountAddressesPage'), 'AccountAddressesPage') },
        ],
      },
      ...developmentRoutes,
      { path: '*', lazy: page(() => import('@/pages/NotFoundPage'), 'NotFoundPage') },
    ],
  },
])
