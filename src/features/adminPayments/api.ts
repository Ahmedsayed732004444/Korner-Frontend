import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/shared/api'

export type AttemptStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Expired'
export type RefundStatus = 'Pending' | 'Succeeded' | 'Failed' | 'Unknown'
export type RefundSource = 'Manual' | 'OrderCancellation' | 'LatePayment' | 'DuplicatePayment' | 'Return'

export interface PaymentAttempt {
  id: string
  method: 'Card' | 'Wallet'
  status: AttemptStatus
  amountPiasters: number
  paidAmountPiasters: number | null
  providerOrderId: string | null
  providerTransactionId: string | null
  failureReason: string | null
  createdAt: string
  completedAt: string | null
}

export interface Refund {
  id: string
  orderId: string
  paymentAttemptId: string
  amountPiasters: number
  status: RefundStatus
  source: RefundSource
  reason: string
  failureReason: string | null
  createdAt: string
  completedAt: string | null
}

export interface OrderPayments {
  orderId: string
  orderNumber: number
  totalPiasters: number
  paidPiasters: number
  refundedPiasters: number
  attempts: PaymentAttempt[]
  refunds: Refund[]
}

const key = (orderId: string) => ['admin', 'payments', orderId] as const

export function useOrderPayments(orderId: string, enabled: boolean) {
  return useQuery({ queryKey: key(orderId), queryFn: ({ signal }) => http<OrderPayments>(`admin/orders/${orderId}/payments`, { signal }), enabled })
}

// Refunds change the money on the order, so both the payments and the order screens are refetched.
function useMoneyAction<TVariables>(orderId: string, request: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: key(orderId) }), queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })]),
  })
}

// One idempotency key per refund attempt: sending the same request twice can never pay out twice.
export function useCreateRefund(orderId: string) {
  return useMoneyAction(orderId, (input: { idempotencyKey: string; amountPiasters: number; reason: string; paymentAttemptId: string | null }) =>
    http<Refund>(`admin/orders/${orderId}/refunds`, { method: 'POST', body: input }),
  )
}

// A refund whose result the gateway never confirmed is settled by a person, after checking the gateway's own dashboard.
export function useResolveRefund(orderId: string) {
  return useMoneyAction(orderId, (input: { refundId: string; succeeded: boolean; note: string | null }) =>
    http<Refund>(`admin/refunds/${input.refundId}/resolve`, { method: 'POST', body: { succeeded: input.succeeded, note: input.note } }),
  )
}
