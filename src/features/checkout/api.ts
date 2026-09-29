import { useMutation, useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api'

export type PaymentMethod = 'Card' | 'Wallet'
export type PaymentState = 'NotStarted' | 'Confirming' | 'Paid' | 'Failed' | 'Cancelled'

export interface CheckoutAddress {
  area: string
  street: string
  building: string
  floor: string | null
  apartment: string | null
  landmark: string | null
}

export interface CheckoutInput {
  checkoutKey: string
  customerName: string
  customerPhone: string
  customerEmail: string
  governorateId: number
  address: CheckoutAddress
  paymentMethod: PaymentMethod
  language: 'Arabic' | 'English'
  acceptTerms: boolean
  marketingConsent: boolean
}

export interface CheckoutOrder {
  orderId: string
  orderNumber: number
  status: string
  subtotalPiasters: number
  shippingFeePiasters: number
  totalPiasters: number
  deliveryDays: number
  reservationExpiresAt: string | null
}

export interface PaymentSession {
  paymentAttemptId: string
  checkoutUrl: string
  expiresAt: string
}

export interface PaymentStatus {
  orderNumber: number
  orderStatus: string
  state: PaymentState
  totalPiasters: number
  expectedDeliveryDate: string | null
  failureReason: string | null
  canRetry: boolean
}

export function useCheckout() {
  return useMutation({
    // The page passes the guest cart header, so this feature doesn't need to know about the cart feature.
    mutationFn: ({ input, headers }: { input: CheckoutInput; headers: Record<string, string> }) =>
      http<CheckoutOrder>('checkout', { method: 'POST', body: input, headers }),
  })
}

export function useStartPayment() {
  return useMutation({
    mutationFn: (request: { orderNumber: number; method: PaymentMethod; phone: string }) =>
      http<PaymentSession>(`orders/${request.orderNumber}/payments`, { method: 'POST', body: { method: request.method, phone: request.phone } }),
  })
}

const pollEveryMs = 3000
const inProgress: PaymentState[] = ['Confirming']

// Keeps asking while the gateway's answer may still be on its way; stops as soon as the payment has a final answer.
export function usePaymentStatus(orderNumber: number | null, phone: string) {
  return useQuery({
    queryKey: ['payment-status', orderNumber, phone],
    queryFn: ({ signal }) => http<PaymentStatus>(`orders/${orderNumber}/payment-status?phone=${encodeURIComponent(phone)}`, { signal }),
    enabled: orderNumber !== null,
    refetchInterval: (query) => (query.state.data && !inProgress.includes(query.state.data.state) ? false : pollEveryMs),
    retry: false,
  })
}
