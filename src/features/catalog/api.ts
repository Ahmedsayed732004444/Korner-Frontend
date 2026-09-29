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
