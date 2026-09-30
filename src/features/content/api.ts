import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api'

export interface Banner {
  id: string
  titleAr: string | null
  titleEn: string | null
  imageUrlAr: string
  imageUrlEn: string
  linkUrl: string | null
}

export type ContentPageType = 'Terms' | 'Privacy' | 'Shipping' | 'Returns' | 'About' | 'Faq'

export interface ContentPage {
  type: ContentPageType
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  updatedAt: string
}

export const contentKeys = {
  banners: ['content', 'banners'] as const,
  page: (type: string) => ['content', 'page', type] as const,
}

// The API answers to any letter case; the route uses the lowercase word from the footer links.
export function useContentPage(type: string) {
  return useQuery({
    queryKey: contentKeys.page(type),
    queryFn: ({ signal }) => http<ContentPage>(`pages/${type}`, { signal }),
    staleTime: 10 * 60_000,
    retry: false,
  })
}

// The API already leaves out banners that are switched off or outside their schedule.
export const bannersQuery = {
  queryKey: contentKeys.banners,
  queryFn: ({ signal }: { signal: AbortSignal }) => http<Banner[]>('banners', { signal }),
  staleTime: 5 * 60_000,
}

export function useBanners() {
  return useQuery(bannersQuery)
}
