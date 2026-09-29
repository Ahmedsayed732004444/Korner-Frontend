import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, toQuery, type Paginated } from '@/shared/api'

export interface InventoryRow {
  variantId: string
  productId: string
  productNameAr: string
  productNameEn: string
  productStatus: 'Draft' | 'Published' | 'Hidden'
  sku: string
  size: string
  colorNameAr: string | null
  colorNameEn: string | null
  stockQuantity: number
  lowStockThreshold: number
  isLowStock: boolean
  isActive: boolean
}

export type MovementType = 'InitialStock' | 'Sale' | 'SaleReleased' | 'Restock' | 'ManualAdjustment'

export interface Movement {
  id: number
  type: MovementType
  quantityChange: number
  quantityAfter: number
  reason: string | null
  orderNumber: number | null
  userName: string | null
  createdAt: string
}

export interface InventoryParams {
  lowStockOnly: boolean
  search: string
  page: number
  pageSize: number
}

export const inventoryKeys = {
  all: ['admin', 'inventory'] as const,
  list: (params: InventoryParams) => ['admin', 'inventory', 'list', params] as const,
  movements: (variantId: string) => ['admin', 'inventory', 'movements', variantId] as const,
}

export function useInventory(params: InventoryParams) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: ({ signal }) =>
      http<Paginated<InventoryRow>>(
        `admin/inventory${toQuery({
          LowStockOnly: params.lowStockOnly || null,
          SearchValue: params.search.trim() || null,
          SortColumn: 'stock',
          PageNumber: params.page,
          PageSize: params.pageSize,
        })}`,
        { signal },
      ),
    placeholderData: keepPreviousData,
  })
}

export function useMovements(variantId: string | null) {
  return useQuery({
    queryKey: inventoryKeys.movements(variantId ?? ''),
    queryFn: ({ signal }) => http<Paginated<Movement>>(`admin/inventory/${variantId}/movements${toQuery({ SortColumn: '-createdAt', PageSize: 20 })}`, { signal }),
    enabled: variantId !== null,
  })
}

// A negative change removes pieces. The API refuses to go below zero and records who did it and why.
export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { variantId: string; quantityChange: number; reason: string }) =>
      http<{ variantId: string; quantityBefore: number; quantityAfter: number }>(`admin/inventory/${input.variantId}/adjustments`, {
        method: 'POST',
        body: { quantityChange: input.quantityChange, reason: input.reason },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: inventoryKeys.all }),
  })
}
