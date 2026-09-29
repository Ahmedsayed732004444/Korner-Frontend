import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/shared/api'

export interface StoreSettingsAdmin {
  freeShippingThresholdPiasters: number | null
  highValueReviewThresholdPiasters: number
  lowStockThreshold: number
  isMaintenanceMode: boolean
  maintenanceMessageAr: string | null
  maintenanceMessageEn: string | null
  supportWhatsApp: string | null
  supportPhone: string | null
  supportEmail: string | null
  updatedAt: string | null
}

export type StoreSettingsInput = Omit<StoreSettingsAdmin, 'updatedAt'>

export interface AdminGovernorate {
  id: number
  nameAr: string
  nameEn: string
  isActive: boolean
  shippingFeePiasters: number
  deliveryDays: number
  sortOrder: number
}

export interface GovernorateInput {
  id: number
  isActive: boolean
  shippingFeePiasters: number
  deliveryDays: number
}

const keys = {
  settings: ['admin', 'settings', 'store'] as const,
  governorates: ['admin', 'settings', 'governorates'] as const,
}

export function useAdminSettings() {
  return useQuery({ queryKey: keys.settings, queryFn: ({ signal }) => http<StoreSettingsAdmin>('admin/settings', { signal }) })
}

export function useAdminGovernorates() {
  return useQuery({ queryKey: keys.governorates, queryFn: ({ signal }) => http<AdminGovernorate[]>('admin/shipping/governorates', { signal }) })
}

// The shop reads these under its own keys (cached for minutes), so they are refreshed too.
function useSettingsAction<TVariables>(request: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }),
        queryClient.invalidateQueries({ queryKey: ['store'] }),
        queryClient.invalidateQueries({ queryKey: ['shipping'] }),
      ]),
  })
}

export function useSaveSettings() {
  return useSettingsAction((input: StoreSettingsInput) => http<StoreSettingsAdmin>('admin/settings', { method: 'PUT', body: input }))
}

export function useSaveGovernorates() {
  return useSettingsAction((items: GovernorateInput[]) => http<unknown>('admin/shipping/governorates', { method: 'PUT', body: { items } }))
}
