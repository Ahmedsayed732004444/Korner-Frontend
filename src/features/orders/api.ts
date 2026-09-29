import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/shared/api'

export type OrderStatus =
  | 'PendingPayment'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'ReturnedToOrigin'
  | 'Cancelled'
  | 'ReturnRequested'
  | 'ReturnClosed'

export interface TrackedItem {
  productNameAr: string
  productNameEn: string
  size: string
  colorNameAr: string | null
  colorNameEn: string | null
  imageUrl: string | null
  quantity: number
  lineTotalPiasters: number
}

export interface TrackedOrder {
  number: number
  status: OrderStatus
  createdAt: string
  deliveryDays: number
  expectedDeliveryDate: string | null
  carrierName: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  totalPiasters: number
  canCancel: boolean
  items: TrackedItem[]
  history: { status: OrderStatus; at: string }[]
}

// The order number and the phone it was placed with are what prove the order is the shopper's.
export function useTrackOrder(lookup: { number: number; phone: string } | null) {
  return useQuery({
    queryKey: ['orders', 'track', lookup?.number, lookup?.phone],
    queryFn: ({ signal }) => http<TrackedOrder>(`orders/track?Number=${lookup!.number}&Phone=${encodeURIComponent(lookup!.phone)}`, { signal }),
    enabled: lookup !== null,
    retry: false,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (order: { number: number; phone: string }) => http<void>(`orders/${order.number}/cancel`, { method: 'POST', body: { phone: order.phone } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  })
}

// The steps a normal order goes through, in the order the shopper expects to see them.
export const progressSteps: OrderStatus[] = ['Confirmed', 'Processing', 'Shipped', 'Delivered']

export function progressIndex(status: OrderStatus): number {
  return progressSteps.indexOf(status)
}
