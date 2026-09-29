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

export const contentKeys = {
  banners: ['content', 'banners'] as const,
}

// The API already leaves out banners that are switched off or outside their schedule.
export function useBanners() {
  return useQuery({
    queryKey: contentKeys.banners,
    queryFn: ({ signal }) => http<Banner[]>('banners', { signal }),
    staleTime: 5 * 60_000,
  })
}
