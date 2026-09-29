import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, toQuery, type Paginated } from '@/shared/api'

export type ReturnStatus = 'Requested' | 'Received' | 'Refunded' | 'Rejected'
export type ReturnChannel = 'WhatsApp' | 'Email'

export interface ReturnRow {
  id: string
  orderId: string
  orderNumber: number
  customerName: string
  status: ReturnStatus
  channel: ReturnChannel
  isStoreFault: boolean
  itemsCount: number
  createdAt: string
  receivedAt: string | null
}

export interface ReturnItem {
  id: string
  orderItemId: string
  productNameAr: string
  productNameEn: string
  size: string
  colorNameAr: string | null
  quantity: number
  unitPricePiasters: number
  restocked: boolean | null
  inspectionNote: string | null
}

export interface ReturnDetails {
  id: string
  orderId: string
  orderNumber: number
  status: ReturnStatus
  channel: ReturnChannel
  reason: string
  isStoreFault: boolean
  imageUrls: string[]
  suggestedRefundPiasters: number
  refundedPiasters: number
  createdAt: string
  receivedAt: string | null
  closedAt: string | null
  rejectionReason: string | null
  items: ReturnItem[]
}

export interface ReturnsParams {
  status: ReturnStatus | null
  search: string
  page: number
  pageSize: number
}

const keys = {
  all: ['admin', 'returns'] as const,
  list: (params: ReturnsParams) => ['admin', 'returns', 'list', params] as const,
  details: (id: string) => ['admin', 'returns', 'details', id] as const,
}

export function useReturns(params: ReturnsParams) {
  return useQuery({
    queryKey: keys.list(params),
    queryFn: ({ signal }) =>
      http<Paginated<ReturnRow>>(
        `admin/returns${toQuery({
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

export function useReturn(id: string) {
  return useQuery({ queryKey: keys.details(id), queryFn: ({ signal }) => http<ReturnDetails>(`admin/returns/${id}`, { signal }), retry: false })
}

// A return touches the order (its status, restocked pieces) and the money, so every admin screen that shows them is refetched.
function useReturnAction<TVariables>(request: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => Promise.all(['returns', 'orders', 'payments', 'inventory'].map((area) => queryClient.invalidateQueries({ queryKey: ['admin', area] }))),
  })
}

export function useCreateReturn(orderId: string) {
  return useReturnAction((input: { channel: ReturnChannel; reason: string; isStoreFault: boolean; items: { orderItemId: string; quantity: number }[] }) =>
    http<ReturnDetails>(`admin/orders/${orderId}/returns`, { method: 'POST', body: input }),
  )
}

export function useReceiveReturn(id: string) {
  return useReturnAction(() => http<void>(`admin/returns/${id}/receive`, { method: 'POST' }))
}

export function useInspectReturn(id: string) {
  return useReturnAction((items: { returnItemId: string; restock: boolean; note: string | null }[]) =>
    http<void>(`admin/returns/${id}/inspection`, { method: 'POST', body: { items } }),
  )
}

export function useRefundReturn(id: string) {
  return useReturnAction((input: { idempotencyKey: string; amountPiasters: number }) => http<void>(`admin/returns/${id}/refund`, { method: 'POST', body: input }))
}

export function useRejectReturn(id: string) {
  return useReturnAction((reason: string) => http<void>(`admin/returns/${id}/reject`, { method: 'POST', body: { reason } }))
}

export function useAddReturnImages(id: string) {
  return useReturnAction((files: File[]) => {
    const form = new FormData()
    files.forEach((file) => form.append('Images', file))
    return http<unknown>(`admin/returns/${id}/images`, { method: 'POST', body: form })
  })
}
