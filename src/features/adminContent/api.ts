import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, type Paginated } from '@/shared/api'

export type PageType = 'Terms' | 'Privacy' | 'Shipping' | 'Returns' | 'About' | 'Faq'
export const pageTypes: PageType[] = ['Terms', 'Privacy', 'Shipping', 'Returns', 'About', 'Faq']

export interface AdminBanner {
  id: string
  titleAr: string | null
  titleEn: string | null
  imageUrlAr: string
  imageUrlEn: string
  linkUrl: string | null
  sortOrder: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
}

export interface BannerInput {
  titleAr: string
  titleEn: string
  linkUrl: string
  sortOrder: number
  isActive: boolean
  startsAt: string | null
  endsAt: string | null
  imageAr: File | null
  imageEn: File | null
}

export interface AdminPage {
  type: PageType
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
  updatedAt: string
}

export interface PageInput {
  titleAr: string
  titleEn: string
  bodyAr: string
  bodyEn: string
}

const keys = {
  banners: ['admin', 'content', 'banners'] as const,
  pages: ['admin', 'content', 'pages'] as const,
}

export function useAdminBanners() {
  return useQuery({
    queryKey: keys.banners,
    queryFn: async ({ signal }) => (await http<Paginated<AdminBanner>>('admin/banners?PageSize=50&SortColumn=sortOrder', { signal })).items,
  })
}

export function useAdminPages() {
  return useQuery({ queryKey: keys.pages, queryFn: ({ signal }) => http<AdminPage[]>('admin/pages', { signal }) })
}

// The storefront caches banners and pages; the API clears its cache on save, and the shop's own copy is left to its short freshness window.
function useContentAction<TVariables>(request: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['admin', 'content'] }), queryClient.invalidateQueries({ queryKey: ['content'] })]),
  })
}

// Banners are sent as a form because each one carries two images (Arabic and English).
function bannerForm(input: BannerInput) {
  const form = new FormData()
  form.append('TitleAr', input.titleAr.trim())
  form.append('TitleEn', input.titleEn.trim())
  form.append('LinkUrl', input.linkUrl.trim())
  form.append('SortOrder', String(input.sortOrder))
  form.append('IsActive', String(input.isActive))
  if (input.startsAt) form.append('StartsAt', input.startsAt)
  if (input.endsAt) form.append('EndsAt', input.endsAt)
  if (input.imageAr) form.append('ImageAr', input.imageAr)
  if (input.imageEn) form.append('ImageEn', input.imageEn)
  return form
}

export function useSaveBanner() {
  return useContentAction((change: { id: string | null; input: BannerInput }) =>
    change.id
      ? http<AdminBanner>(`admin/banners/${change.id}`, { method: 'PUT', body: bannerForm(change.input) })
      : http<AdminBanner>('admin/banners', { method: 'POST', body: bannerForm(change.input) }),
  )
}

export function useDeleteBanner() {
  return useContentAction((id: string) => http<void>(`admin/banners/${id}`, { method: 'DELETE' }))
}

export function useSavePage() {
  return useContentAction((change: { type: PageType; input: PageInput }) => http<AdminPage>(`admin/pages/${change.type}`, { method: 'PUT', body: change.input }))
}
