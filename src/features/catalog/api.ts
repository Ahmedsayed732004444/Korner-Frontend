import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api'

export interface CategoryNode {
  id: string
  nameAr: string
  nameEn: string
  slugAr: string
  slugEn: string
  imageUrl: string | null
  children: CategoryNode[]
}

export const catalogKeys = {
  categoryTree: ['catalog', 'categories'] as const,
}

export function useCategoryTree() {
  return useQuery({
    queryKey: catalogKeys.categoryTree,
    queryFn: ({ signal }) => http<CategoryNode[]>('categories', { signal }),
    staleTime: 10 * 60_000,
  })
}
