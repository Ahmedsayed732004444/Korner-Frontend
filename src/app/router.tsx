import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { env } from '@/shared/config/env'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RootLayout } from './RootLayout'

const developmentRoutes: RouteObject[] = env.isDevelopment
  ? [{ path: 'styleguide', lazy: async () => ({ Component: (await import('@/pages/StyleGuidePage')).StyleGuidePage }) }]
  : []

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [{ index: true, element: <HomePage /> }, ...developmentRoutes, { path: '*', element: <NotFoundPage /> }],
  },
])
