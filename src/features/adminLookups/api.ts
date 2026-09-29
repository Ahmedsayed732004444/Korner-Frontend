import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, type Paginated } from '@/shared/api'

export type ProductType = 'Apparel' | 'Footwear' | 'Perfume'

export interface CategoryNode {
  id: string
  parentId: string | null
  nameAr: string
  nameEn: string
  slugAr: string
  slugEn: string
  imageUrl: string | null
  sortOrder: number
  isActive: boolean
  children: CategoryNode[]
}

export interface CategoryInput {
  nameAr: string
  nameEn: string
  slugAr: string | null
  slugEn: string | null
  parentId: string | null
  sortOrder: number
  isActive: boolean
}

export interface Brand {
  id: string
  nameAr: string
  nameEn: string
  slug: string
  logoUrl: string | null
  isActive: boolean
}

export interface BrandInput {
  nameAr: string
  nameEn: string
  slug: string | null
  isActive: boolean
}

export interface Color {
  id: string
  nameAr: string
  nameEn: string
  hexCode: string
  sortOrder: number
}

export type ColorInput = Omit<Color, 'id'>

export interface SizeChartRow {
  id: string
  nameAr: string
  nameEn: string
  productType: ProductType | null
  brandId: string | null
  brandNameEn: string | null
}

export interface SizeChart {
  id: string
  nameAr: string
  nameEn: string
  notesAr: string | null
  notesEn: string | null
  productType: ProductType | null
  brandId: string | null
  columns: { headerAr: string; headerEn: string }[]
  rows: { size: string; values: string[] }[]
}

export interface SizeChartInput {
  nameAr: string
  nameEn: string
  notesAr: string | null
  notesEn: string | null
  productType: ProductType | null
  brandId: string | null
  columns: { headerAr: string; headerEn: string }[]
  rows: { size: string; values: string[] }[]
}

const keys = {
  categories: ['admin', 'lookups', 'categories'] as const,
  brands: ['admin', 'lookups', 'brands'] as const,
  colors: ['admin', 'lookups', 'colors'] as const,
  charts: ['admin', 'lookups', 'charts'] as const,
  chart: (id: string) => ['admin', 'lookups', 'chart', id] as const,
}

const pageOfFifty = 'PageSize=50'

export function useCategoryTree() {
  return useQuery({ queryKey: keys.categories, queryFn: ({ signal }) => http<CategoryNode[]>('admin/categories', { signal }) })
}

export function useBrands() {
  return useQuery({
    queryKey: keys.brands,
    queryFn: async ({ signal }) => (await http<Paginated<Brand>>(`admin/brands?${pageOfFifty}`, { signal })).items,
  })
}

export function useColors() {
  return useQuery({
    queryKey: keys.colors,
    queryFn: async ({ signal }) => (await http<Paginated<Color>>(`admin/colors?${pageOfFifty}&SortColumn=sortOrder`, { signal })).items,
  })
}

export function useSizeCharts() {
  return useQuery({
    queryKey: keys.charts,
    queryFn: async ({ signal }) => (await http<Paginated<SizeChartRow>>(`admin/size-charts?${pageOfFifty}`, { signal })).items,
  })
}

export function useSizeChart(id: string | null) {
  return useQuery({ queryKey: keys.chart(id ?? ''), queryFn: ({ signal }) => http<SizeChart>(`admin/size-charts/${id}`, { signal }), enabled: id !== null })
}

// The product form reads the same lists under its own keys, so both prefixes are refreshed after any change here.
function useLookupAction<TVariables, TResult = unknown>(request: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: ['admin', 'lookups'] }), queryClient.invalidateQueries({ queryKey: ['admin', 'catalog'] })]),
  })
}

function imageForm(file: File) {
  const form = new FormData()
  form.append('File', file)
  return form
}

export const categoryActions = {
  useSave: () =>
    useLookupAction((change: { id: string | null; input: CategoryInput }) =>
      change.id
        ? http<CategoryNode>(`admin/categories/${change.id}`, { method: 'PUT', body: change.input })
        : http<CategoryNode>('admin/categories', { method: 'POST', body: change.input }),
    ),
  useImage: () => useLookupAction((change: { id: string; file: File }) => http<unknown>(`admin/categories/${change.id}/image`, { method: 'PUT', body: imageForm(change.file) })),
  useDelete: () => useLookupAction((id: string) => http<void>(`admin/categories/${id}`, { method: 'DELETE' })),
}

export const brandActions = {
  useSave: () =>
    useLookupAction((change: { id: string | null; input: BrandInput }) =>
      change.id ? http<Brand>(`admin/brands/${change.id}`, { method: 'PUT', body: change.input }) : http<Brand>('admin/brands', { method: 'POST', body: change.input }),
    ),
  useLogo: () => useLookupAction((change: { id: string; file: File }) => http<unknown>(`admin/brands/${change.id}/logo`, { method: 'PUT', body: imageForm(change.file) })),
  useDelete: () => useLookupAction((id: string) => http<void>(`admin/brands/${id}`, { method: 'DELETE' })),
}

export const colorActions = {
  useSave: () =>
    useLookupAction((change: { id: string | null; input: ColorInput }) =>
      change.id ? http<Color>(`admin/colors/${change.id}`, { method: 'PUT', body: change.input }) : http<Color>('admin/colors', { method: 'POST', body: change.input }),
    ),
  useDelete: () => useLookupAction((id: string) => http<void>(`admin/colors/${id}`, { method: 'DELETE' })),
}

export const sizeChartActions = {
  useSave: () =>
    useLookupAction((change: { id: string | null; input: SizeChartInput }) =>
      change.id ? http<SizeChart>(`admin/size-charts/${change.id}`, { method: 'PUT', body: change.input }) : http<SizeChart>('admin/size-charts', { method: 'POST', body: change.input }),
    ),
  useDelete: () => useLookupAction((id: string) => http<void>(`admin/size-charts/${id}`, { method: 'DELETE' })),
}
