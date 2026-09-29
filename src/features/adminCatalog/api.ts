import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, toQuery, type Paginated } from '@/shared/api'

export type ProductType = 'Apparel' | 'Footwear' | 'Perfume'
export type ProductStatus = 'Draft' | 'Published' | 'Hidden'
export type Fulfillment = 'InStock' | 'OnDemand'
export type Concentration = 'EauDeToilette' | 'EauDeParfum' | 'Parfum'

export interface ProductRow {
  id: string
  nameAr: string
  nameEn: string
  type: ProductType
  status: ProductStatus
  categoryNameEn: string
  brandNameEn: string | null
  minPricePiasters: number
  isOnSale: boolean
  inStock: boolean
  totalStock: number
  variantsCount: number
  imageUrl: string | null
  createdAt: string
}

export interface PerfumeFields {
  concentration: Concentration
  scentFamilyAr: string
  scentFamilyEn: string
  topNotesAr: string | null
  topNotesEn: string | null
  heartNotesAr: string | null
  heartNotesEn: string | null
  baseNotesAr: string | null
  baseNotesEn: string | null
}

export interface AdminVariant {
  id: string
  colorId: string | null
  colorNameAr: string | null
  colorNameEn: string | null
  colorHex: string | null
  size: string
  sortOrder: number
  sku: string
  pricePiasters: number
  compareAtPricePiasters: number | null
  fulfillmentType: Fulfillment
  stockQuantity: number
  leadTimeDays: number
  lowStockThreshold: number | null
  isActive: boolean
}

export interface AdminImage {
  id: string
  url: string
  colorId: string | null
  altAr: string | null
  altEn: string | null
  sortOrder: number
}

export interface AdminProduct {
  id: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  slugAr: string
  slugEn: string
  metaTitleAr: string | null
  metaTitleEn: string | null
  metaDescriptionAr: string | null
  metaDescriptionEn: string | null
  type: ProductType
  status: ProductStatus
  categoryId: string
  brandId: string | null
  sizeChartId: string | null
  perfume: PerfumeFields | null
  minPricePiasters: number
  inStock: boolean
  variants: AdminVariant[]
  images: AdminImage[]
  publishIssues: string[]
}

export interface ProductInput {
  nameAr: string
  nameEn: string
  descriptionAr: string | null
  descriptionEn: string | null
  slugAr: string | null
  slugEn: string | null
  metaTitleAr: string | null
  metaTitleEn: string | null
  metaDescriptionAr: string | null
  metaDescriptionEn: string | null
  type: ProductType
  categoryId: string
  brandId: string | null
  sizeChartId: string | null
  perfume: PerfumeFields | null
}

export interface VariantInput {
  colorId: string | null
  size: string
  sortOrder: number
  sku: string
  pricePiasters: number
  compareAtPricePiasters: number | null
  fulfillmentType: Fulfillment
  leadTimeDays: number
  lowStockThreshold: number | null
  isActive: boolean
}

export interface CategoryOption {
  id: string
  nameAr: string
  nameEn: string
  isActive: boolean
  children: CategoryOption[]
}

export interface Lookup {
  id: string
  nameAr: string
  nameEn: string
  hexCode?: string
}

export interface ProductsParams {
  status: ProductStatus | null
  search: string
  page: number
  pageSize: number
}

export const catalogKeys = {
  all: ['admin', 'catalog'] as const,
  list: (params: ProductsParams) => ['admin', 'catalog', 'list', params] as const,
  product: (id: string) => ['admin', 'catalog', 'product', id] as const,
  categories: ['admin', 'catalog', 'categories'] as const,
  brands: ['admin', 'catalog', 'brands'] as const,
  colors: ['admin', 'catalog', 'colors'] as const,
  sizeCharts: ['admin', 'catalog', 'sizeCharts'] as const,
}

export function useAdminProducts(params: ProductsParams) {
  return useQuery({
    queryKey: catalogKeys.list(params),
    queryFn: ({ signal }) =>
      http<Paginated<ProductRow>>(
        `admin/products${toQuery({
          Filter: params.status ? `status:eq:${params.status}` : null,
          SearchValue: params.search.trim() || null,
          SortColumn: '-createdAt',
          PageNumber: params.page,
          PageSize: params.pageSize,
        })}`,
        { signal },
      ),
    placeholderData: keepPreviousData,
  })
}

export function useAdminProduct(id: string | null) {
  return useQuery({
    queryKey: catalogKeys.product(id ?? ''),
    queryFn: ({ signal }) => http<AdminProduct>(`admin/products/${id}`, { signal }),
    enabled: id !== null,
    retry: false,
  })
}

// The lists that fill the product form's dropdowns. They change rarely, so they are kept for a few minutes.
const lookupOptions = { staleTime: 5 * 60_000 }

export function useCategoryOptions() {
  return useQuery({ queryKey: catalogKeys.categories, queryFn: ({ signal }) => http<CategoryOption[]>('admin/categories', { signal }), ...lookupOptions })
}

export function useBrandOptions() {
  return useQuery({
    queryKey: catalogKeys.brands,
    queryFn: async ({ signal }) => (await http<Paginated<Lookup>>('admin/brands?PageSize=50', { signal })).items,
    ...lookupOptions,
  })
}

export function useColorOptions() {
  return useQuery({
    queryKey: catalogKeys.colors,
    queryFn: async ({ signal }) => (await http<Paginated<Lookup>>('admin/colors?PageSize=50', { signal })).items,
    ...lookupOptions,
  })
}

export function useSizeChartOptions() {
  return useQuery({
    queryKey: catalogKeys.sizeCharts,
    queryFn: async ({ signal }) => (await http<Paginated<Lookup>>('admin/size-charts?PageSize=50', { signal })).items,
    ...lookupOptions,
  })
}

function useCatalogAction<TVariables, TResult = unknown>(request: (variables: TVariables) => Promise<TResult>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: catalogKeys.all }),
  })
}

export function useCreateProduct() {
  return useCatalogAction((input: ProductInput) => http<AdminProduct>('admin/products', { method: 'POST', body: input }))
}

export function useUpdateProduct(id: string) {
  return useCatalogAction((input: ProductInput) => http<void>(`admin/products/${id}`, { method: 'PUT', body: input }))
}

export function useChangeProductStatus(id: string) {
  return useCatalogAction((status: ProductStatus) => http<void>(`admin/products/${id}/status`, { method: 'PUT', body: { status } }))
}

export function useDeleteProduct() {
  return useCatalogAction((id: string) => http<void>(`admin/products/${id}`, { method: 'DELETE' }))
}

export function useAddVariant(productId: string) {
  return useCatalogAction((input: VariantInput & { initialStock: number }) => http<AdminVariant>(`admin/products/${productId}/variants`, { method: 'POST', body: input }))
}

export function useUpdateVariant(productId: string) {
  return useCatalogAction((change: { id: string; input: VariantInput }) => http<void>(`admin/products/${productId}/variants/${change.id}`, { method: 'PUT', body: change.input }))
}

export function useDeleteVariant(productId: string) {
  return useCatalogAction((id: string) => http<void>(`admin/products/${productId}/variants/${id}`, { method: 'DELETE' }))
}

export function useUploadImages(productId: string) {
  return useCatalogAction((input: { files: File[]; colorId: string | null }) => {
    const form = new FormData()
    input.files.forEach((file) => form.append('Files', file))
    if (input.colorId) form.append('ColorId', input.colorId)
    return http<unknown>(`admin/products/${productId}/images`, { method: 'POST', body: form })
  })
}

export function useUpdateImage(productId: string) {
  return useCatalogAction((change: { id: string; colorId: string | null; altAr: string | null; altEn: string | null }) =>
    http<void>(`admin/products/${productId}/images/${change.id}`, { method: 'PUT', body: { colorId: change.colorId, altAr: change.altAr, altEn: change.altEn } }),
  )
}

export function useReorderImages(productId: string) {
  return useCatalogAction((imageIds: string[]) => http<void>(`admin/products/${productId}/images/order`, { method: 'PUT', body: { imageIds } }))
}

export function useDeleteImage(productId: string) {
  return useCatalogAction((id: string) => http<void>(`admin/products/${productId}/images/${id}`, { method: 'DELETE' }))
}
