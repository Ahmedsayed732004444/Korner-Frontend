import { useQuery } from '@tanstack/react-query'
import { http } from '@/shared/api'

export interface StoreSettings {
  freeShippingThresholdPiasters: number | null
  isMaintenanceMode: boolean
  maintenanceMessageAr: string | null
  maintenanceMessageEn: string | null
  supportWhatsApp: string | null
  supportPhone: string | null
  supportEmail: string | null
  returnWindowDays: number
  paymentMethods: ('Card' | 'Wallet')[]
  googleClientId: string | null
  maxQuantityPerCartItem: number
}

export const storeKeys = {
  settings: ['store', 'settings'] as const,
}

// Settings change rarely; one fetch per 5 minutes is plenty, and maintenance mode still shows up quickly.
export const storeSettingsQuery = {
  queryKey: storeKeys.settings,
  queryFn: ({ signal }: { signal: AbortSignal }) => http<StoreSettings>('store/settings', { signal }),
  staleTime: 5 * 60_000,
}

export function useStoreSettings() {
  return useQuery(storeSettingsQuery)
}
