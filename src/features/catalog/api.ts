import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { http, toQuery, type Paginated } from '@/shared/api'

export interface CategoryNode {
  id: string
  nameAr: string
  nameEn: string
  slugAr: string
  slugEn: string
  imageUrl: string | null
  children: CategoryNode[]
}

export interface CategoryLink {
  id: string
  nameAr: string
  nameEn: string
  slugAr: string
  slugEn: string
}

export interface CategoryPage extends CategoryLink {
  imageUrl: string | null
  parent: CategoryLink | null
  children: CategoryLink[]
}

// One product as a card in a list. Money is integer piasters, exactly as the API sends it.
export interface ProductCard {
  id: string
  nameAr: string
  nameEn: string
  slugAr: string
  slugEn: string
  brandNameAr: string | null
  brandNameEn: string | null
  minPricePiasters: number
  compareAtPricePiasters: number | null
  isOnSale: boolean
  inStock: boolean
  imageUrl: string | null
  colorHexCodes: string[]
}

export interface ProductFacets {
  brands: { id: string; nameAr: string; nameEn: string; productsCount: number }[]
  colors: { id: string; nameAr: string; nameEn: string; hexCode: string; productsCount: number }[]
  sizes: string[]
  minPricePiasters: number | null
  maxPricePiasters: number | null
}

export interface ColorOption {
  id: string
  nameAr: string
  nameEn: string
  hexCode: string
}

export interface VariantOption {
  id: string
  colorId: string | null
  size: string
  pricePiasters: number
  compareAtPricePiasters: number | null
  fulfillmentType: 'InStock' | 'OnDemand'
  leadTimeDays: number
  isAvailable: boolean
}

export interface ProductImage {
  id: string
  url: string
  colorId: string | null
  altAr: string | null
  altEn: string | null
  sortOrder: number
}

export interface SizeChart {
  nameAr: string
  nameEn: string
  notesAr: string | null
  notesEn: string | null
  columns: { headerAr: string; headerEn: string }[]
  rows: { size: string; values: string[] }[]
}

export interface PerfumeDetails {
  concentration: 'EauDeToilette' | 'EauDeParfum' | 'Parfum'
  scentFamilyAr: string
  scentFamilyEn: string
  topNotesAr: string | null
  topNotesEn: string | null
  heartNotesAr: string | null
  heartNotesEn: string | null
  baseNotesAr: string | null
  baseNotesEn: string | null
}

// One product's page. `delivery` is the range across the governorates the store ships to today.
export interface ProductPage {
  id: string
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  slugAr: string
  slugEn: string
  type: 'Apparel' | 'Footwear' | 'Perfume'
  category: CategoryLink
  parentCategory: CategoryLink | null
  brand: { id: string; nameAr: string; nameEn: string } | null
  perfume: PerfumeDetails | null
  minPricePiasters: number
  inStock: boolean
  colors: ColorOption[]
  variants: VariantOption[]
  images: ProductImage[]
  sizeChart: SizeChart | null
  delivery: { minDays: number; maxDays: number } | null
}

export interface ProductListParams {
  /** Category slug (Arabic or English). */
  category?: string
  searchValue?: string
  /** Backend sort syntax: a leading "-" means descending, e.g. "-salesCount". */
  sort?: string
  colors?: string[]
  sizes?: string[]
  brandIds?: string[]
  minPricePiasters?: number
  maxPricePiasters?: number
  onSaleOnly?: boolean
  availableOnly?: boolean
  pageNumber?: number
  pageSize?: number
}

export const catalogKeys = {
  categoryTree: ['catalog', 'categories'] as const,
  category: (slug: string) => ['catalog', 'category', slug] as const,
  product: (slug: string) => ['catalog', 'product', slug] as const,
  products: (params: ProductListParams) => ['catalog', 'products', params] as const,
  facets: (category: string | undefined, searchValue: string | undefined) => ['catalog', 'facets', category ?? null, searchValue ?? null] as const,
}

export function useCategoryTree() {
  return useQuery({
    queryKey: catalogKeys.categoryTree,
    queryFn: ({ signal }) => http<CategoryNode[]>('categories', { signal }),
    staleTime: 10 * 60_000,
  })
}

export function useCategoryPage(slug: string) {
  return useQuery({
    queryKey: catalogKeys.category(slug),
    queryFn: ({ signal }) => http<CategoryPage>(`categories/${encodeURIComponent(slug)}`, { signal }),
    staleTime: 10 * 60_000,
    retry: false,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: catalogKeys.product(slug),
    queryFn: ({ signal }) => http<ProductPage>(`products/${encodeURIComponent(slug)}`, { signal }),
    staleTime: 60_000,
    retry: false,
  })
}

export function useProducts(params: ProductListParams) {
  const priceFilters = [
    params.minPricePiasters !== undefined ? `price:gte:${params.minPricePiasters}` : null,
    params.maxPricePiasters !== undefined ? `price:lte:${params.maxPricePiasters}` : null,
    params.onSaleOnly ? 'isOnSale:eq:true' : null,
    params.brandIds?.length ? `brandId:in:${params.brandIds.join(',')}` : null,
  ].filter((filter): filter is string => filter !== null)

  return useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: ({ signal }) =>
      http<Paginated<ProductCard>>(
        `products${toQuery({
          Category: params.category,
          SearchValue: params.searchValue,
          SortColumn: params.sort,
          Colors: params.colors,
          Sizes: params.sizes,
          Filter: priceFilters,
          AvailableOnly: params.availableOnly || undefined,
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
        })}`,
        { signal },
      ),
    staleTime: 2 * 60_000,
    // While a new filter loads, the previous results stay on screen (dimmed) instead of flashing empty.
    placeholderData: keepPreviousData,
  })
}

export function useFacets(category: string | undefined, searchValue: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.facets(category, searchValue),
    queryFn: ({ signal }) => http<ProductFacets>(`products/facets${toQuery({ category, searchValue })}`, { signal }),
    staleTime: 5 * 60_000,
  })
}
