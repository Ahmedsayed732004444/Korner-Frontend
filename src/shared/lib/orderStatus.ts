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

export function orderStatusTone(status: OrderStatus): 'error' | 'success' | 'info' {
  if (status === 'Cancelled') return 'error'
  if (status === 'Delivered') return 'success'
  return 'info'
}

// After these the order is finished or off the road, so "expected delivery" would only confuse.
export function isDeliveryPending(status: OrderStatus): boolean {
  return !['Cancelled', 'Delivered', 'ReturnedToOrigin', 'ReturnRequested', 'ReturnClosed'].includes(status)
}
