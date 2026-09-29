import { useQuery } from '@tanstack/react-query'
import { http, toQuery } from '@/shared/api'
import type { OrderStatus } from '@/shared/lib/orderStatus'

export interface DailyReport {
  date: string
  ordersPlaced: number
  ordersConfirmed: number
  itemsSold: number
  revenuePiasters: number
  refundedPiasters: number
  netPiasters: number
  ordersByStatus: Partial<Record<OrderStatus, number>>
}

// An empty date means "today" in the store's time zone.
export function useDailyReport(date: string) {
  return useQuery({
    queryKey: ['admin', 'reports', 'daily', date],
    queryFn: ({ signal }) => http<DailyReport>(`admin/reports/daily${toQuery({ Date: date || null })}`, { signal }),
    staleTime: 30_000,
  })
}
