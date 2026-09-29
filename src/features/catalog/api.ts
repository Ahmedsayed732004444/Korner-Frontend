import { useQuery } from '@tanstack/react-query'
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

export interface ProductListParams {
  /** Category slug (Arabic or English). */
  category?: string
  searchValue?: string
  /** Backend sort syntax: a leading "-" means descending, e.g. "-salesCount". */
  sort?: string
  onSaleOnly?: boolean
  availableOnly?: boolean
  pageNumber?: number
  pageSize?: number
}

export const catalogKeys = {
  categoryTree: ['catalog', 'categories'] as const,
  products: (params: ProductListParams) => ['catalog', 'products', params] as const,
}

export function useCategoryTree() {
  return useQuery({
    queryKey: catalogKeys.categoryTree,
    queryFn: ({ signal }) => http<CategoryNode[]>('categories', { signal }),
    staleTime: 10 * 60_000,
  })
}

export function useProducts(params: ProductListParams) {
  return useQuery({
    queryKey: catalogKeys.products(params),
    queryFn: ({ signal }) =>
      http<Paginated<ProductCard>>(
        `products${toQuery({
          Category: params.category,
          SearchValue: params.searchValue,
          SortColumn: params.sort,
          Filter: params.onSaleOnly ? ['isOnSale:eq:true'] : undefined,
          AvailableOnly: params.availableOnly,
          PageNumber: params.pageNumber,
          PageSize: params.pageSize,
        })}`,
        { signal },
      ),
    staleTime: 2 * 60_000,
  })
}
