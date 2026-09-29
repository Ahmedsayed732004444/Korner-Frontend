import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, toQuery, useSession, type Paginated } from '@/shared/api'
import type { OrderStatus } from '@/shared/lib/orderStatus'

export type Language = 'Arabic' | 'English'

export interface Profile {
  id: string
  firstName: string
  lastName: string
  email: string
  preferredLanguage: Language
  marketingConsent: boolean
}

export interface AddressFields {
  area: string
  street: string
  building: string
  floor: string | null
  apartment: string | null
  landmark: string | null
}

export interface SavedAddress {
  id: string
  recipientName: string
  phone: string
  governorateId: number
  governorateNameAr: string
  governorateNameEn: string
  address: AddressFields
  isDefault: boolean
}

export interface SaveAddressInput {
  recipientName: string
  phone: string
  governorateId: number
  address: AddressFields
  isDefault: boolean
}

export interface AccountOrderSummary {
  number: number
  status: OrderStatus
  itemsCount: number
  totalPiasters: number
  imageUrl: string | null
  expectedDeliveryDate: string | null
  createdAt: string
}

export interface AccountOrderItem {
  productNameAr: string
  productNameEn: string
  size: string
  colorNameAr: string | null
  colorNameEn: string | null
  imageUrl: string | null
  quantity: number
  lineTotalPiasters: number
}

export interface AccountOrder {
  number: number
  status: OrderStatus
  createdAt: string
  expectedDeliveryDate: string | null
  carrierName: string | null
  trackingNumber: string | null
  trackingUrl: string | null
  recipientName: string
  phone: string
  governorateNameAr: string
  governorateNameEn: string
  address: AddressFields
  subtotalPiasters: number
  shippingFeePiasters: number
  totalPiasters: number
  refundedPiasters: number
  canCancel: boolean
  canPay: boolean
  items: AccountOrderItem[]
  history: { status: OrderStatus; at: string }[]
}

export const accountKeys = {
  all: ['account'] as const,
  profile: ['account', 'profile'] as const,
  addresses: ['account', 'addresses'] as const,
  orders: (page: number) => ['account', 'orders', page] as const,
  order: (number: number) => ['account', 'order', number] as const,
}

// Every account query is off while nobody is signed in, so the guest never sends a request that can only fail.
function useSignedIn() {
  return useSession() !== null
}

export function useProfile() {
  const enabled = useSignedIn()
  return useQuery({ queryKey: accountKeys.profile, queryFn: ({ signal }) => http<Profile>('account/profile', { signal }), enabled })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { preferredLanguage: Language; marketingConsent: boolean }) => http<void>('account/preferences', { method: 'PUT', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.profile }),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => http<void>('account/change-password', { method: 'POST', body: input }),
  })
}

export function useRequestDeletion() {
  return useMutation({ mutationFn: () => http<void>('account/deletion-request', { method: 'POST' }) })
}

export function useAddresses() {
  const enabled = useSignedIn()
  return useQuery({ queryKey: accountKeys.addresses, queryFn: ({ signal }) => http<SavedAddress[]>('account/addresses', { signal }), enabled, staleTime: 60_000 })
}

export function useSaveAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: SaveAddressInput }) =>
      id ? http<SavedAddress>(`account/addresses/${id}`, { method: 'PUT', body: input }) : http<SavedAddress>('account/addresses', { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => http<void>(`account/addresses/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.addresses }),
  })
}

const ordersPageSize = 10

export function useAccountOrders(page: number) {
  const enabled = useSignedIn()
  return useQuery({
    queryKey: accountKeys.orders(page),
    queryFn: ({ signal }) => http<Paginated<AccountOrderSummary>>(`account/orders${toQuery({ PageNumber: page, PageSize: ordersPageSize })}`, { signal }),
    enabled,
  })
}

export function useAccountOrder(number: number) {
  const enabled = useSignedIn()
  return useQuery({ queryKey: accountKeys.order(number), queryFn: ({ signal }) => http<AccountOrder>(`account/orders/${number}`, { signal }), enabled, retry: false })
}

// A signed-in customer proves ownership with the account, so no phone is sent.
export function useCancelAccountOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (number: number) => http<void>(`orders/${number}/cancel`, { method: 'POST', body: { phone: null } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  })
}

export function usePayAccountOrder() {
  return useMutation({
    mutationFn: (number: number) => http<{ checkoutUrl: string }>(`orders/${number}/payments`, { method: 'POST', body: { method: 'Card', phone: null } }),
  })
}
