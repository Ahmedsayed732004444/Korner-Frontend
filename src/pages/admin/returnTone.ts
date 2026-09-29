import type { ReturnStatus } from '@/features/adminReturns'

export function returnTone(status: ReturnStatus): 'info' | 'warning' | 'success' | 'error' {
  if (status === 'Refunded') return 'success'
  if (status === 'Rejected') return 'error'
  if (status === 'Received') return 'info'
  return 'warning'
}
