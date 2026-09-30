import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, toQuery, type Paginated } from '@/shared/api'
import type { OrderStatus } from '@/shared/lib/orderStatus'

export interface AdminOrderRow {
  id: string
  number: number
  status: OrderStatus
  customerName: string
  customerPhone: string
  customerEmail: string
  governorateNameAr: string
  itemsCount: number
  totalPiasters: number
  paidPiasters: number
  refundedPiasters: number
  needsReview: boolean
  expectedDeliveryDate: string | null
  createdAt: string
}

export interface OrderCounts {
  counts: Partial<Record<OrderStatus, number>>
  needsReview: number
}

export interface AdminOrderItem {
  id: string
  productId: string
  variantId: string
  productNameAr: string
  productNameEn: string
  sku: string
  size: string
  colorNameAr: string | null
  colorNameEn: string | null
  imageUrl: string | null
  unitPricePiasters: number
  quantity: number
  lineTotalPiasters: number
  fulfillmentType: 'InStock' | 'OnDemand'
  returnedQuantity: number
}

export interface AdminOrder {
  id: string
  number: number
  status: OrderStatus
  reviewReasons: string[]
  customerName: string
  customerPhone: string
  customerEmail: string
  language: 'Arabic' | 'English'
  governorateNameAr: string
  governorateNameEn: string
  address: { area: string; street: string; building: string; floor: string | null; apartment: string | null; landmark: string | null }
  subtotalPiasters: number
  shippingFeePiasters: number
  totalPiasters: number
  paidPiasters: number
  refundedPiasters: number
  deliveryDays: number
  expectedDeliveryDate: string | null
  carrierName: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  cancellationReason: string | null
  createdAt: string
  items: AdminOrderItem[]
  history: { fromStatus: OrderStatus | null; toStatus: OrderStatus; note: string | null; userName: string | null; at: string }[]
  notes: { id: string; body: string; attachmentUrls: string[]; authorName: string | null; createdAt: string }[]
  activity: { action: string; oldValues: string | null; newValues: string | null; userName: string | null; at: string }[]
  availableStatuses: OrderStatus[]
  canCancel: boolean
  canShip: boolean
  canEdit: boolean
  canRequestReturn: boolean
  canRestock: boolean
}

export interface AdminOrdersParams {
  status: OrderStatus | null
  search: string
  needsReviewOnly: boolean
  page: number
  pageSize: number
}

export const adminOrderKeys = {
  all: ['admin', 'orders'] as const,
  list: (params: AdminOrdersParams) => ['admin', 'orders', 'list', params] as const,
  counts: ['admin', 'orders', 'counts'] as const,
  details: (id: string) => ['admin', 'orders', 'details', id] as const,
}

export function useAdminOrders(params: AdminOrdersParams) {
  return useQuery({
    queryKey: adminOrderKeys.list(params),
    queryFn: ({ signal }) =>
      http<Paginated<AdminOrderRow>>(
        `admin/orders${toQuery({
          Filter: params.status ? `status:eq:${params.status}` : null,
          SearchValue: params.search.trim() || null,
          NeedsReviewOnly: params.needsReviewOnly || null,
          SortColumn: '-createdAt',
          PageNumber: params.page,
          PageSize: params.pageSize,
        })}`,
        { signal },
      ),
    placeholderData: keepPreviousData,
  })
}

export function useOrderCounts() {
  return useQuery({ queryKey: adminOrderKeys.counts, queryFn: ({ signal }) => http<OrderCounts>('admin/orders/counts', { signal }), staleTime: 30_000 })
}

export function useAdminOrder(id: string) {
  return useQuery({ queryKey: adminOrderKeys.details(id), queryFn: ({ signal }) => http<AdminOrder>(`admin/orders/${id}`, { signal }), retry: false })
}

// Every action changes the order and the counters on the list, so both are refetched.
function useOrderAction<TVariables>(request: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminOrderKeys.all }),
  })
}

export function useChangeOrderStatus(id: string) {
  return useOrderAction((input: { status: OrderStatus; note: string | null }) => http<void>(`admin/orders/${id}/status`, { method: 'POST', body: input }))
}

export function useShipOrder(id: string) {
  return useOrderAction((input: { carrierName: string; trackingNumber: string; trackingUrl: string | null }) =>
    http<void>(`admin/orders/${id}/shipment`, { method: 'POST', body: input }),
  )
}

export function useCancelOrderAsAdmin(id: string) {
  return useOrderAction((reason: string) => http<void>(`admin/orders/${id}/cancel`, { method: 'POST', body: { reason } }))
}

export function useUpdateOrderAddress(id: string) {
  return useOrderAction((input: { governorateId: number; address: { area: string; street: string; building: string; floor: string | null; apartment: string | null; landmark: string | null } }) =>
    http<void>(`admin/orders/${id}/address`, { method: 'PUT', body: input }),
  )
}

// Same product and same price only: the reserved stock moves to the new variant.
export function useChangeItemVariant(orderId: string) {
  return useOrderAction((input: { itemId: string; variantId: string }) =>
    http<void>(`admin/orders/${orderId}/items/${input.itemId}/variant`, { method: 'PUT', body: { variantId: input.variantId } }),
  )
}

// After a parcel came back to us, the pieces that are fine go back to stock.
export function useRestockOrder(id: string) {
  return useOrderAction((items: { orderItemId: string; quantity: number }[]) => http<void>(`admin/orders/${id}/restock`, { method: 'POST', body: { items } }))
}

// The note goes as a form because it can carry photos (a damaged parcel, a chat screenshot).
export function useAddOrderNote(id: string) {
  return useOrderAction((input: { body: string; images: File[] }) => {
    const form = new FormData()
    form.append('Body', input.body)
    input.images.forEach((image) => form.append('Images', image))
    return http<unknown>(`admin/orders/${id}/notes`, { method: 'POST', body: form })
  })
}

export interface CarrierInfo {
  name: string
  isEnabled: boolean
}

// Whether a carrier (Bosta) is connected, so the order screen can offer to book the parcel.
export function useCarrier() {
  return useQuery({ queryKey: ['admin', 'orders', 'carrier'], queryFn: ({ signal }) => http<CarrierInfo>('admin/orders/carrier', { signal }), staleTime: 5 * 60_000 })
}

// The API books the parcel with the carrier and records the tracking number, exactly like a manual shipment.
export function useShipWithCarrier(id: string) {
  return useOrderAction(() => http<{ carrierName: string; trackingNumber: string; trackingUrl: string }>(`admin/orders/${id}/carrier-shipment`, { method: 'POST' }))
}

export function useClearReview(id: string) {
  return useOrderAction((note: string) => http<void>(`admin/orders/${id}/clear-review`, { method: 'POST', body: { note } }))
}
