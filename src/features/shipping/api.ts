import { useQuery } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { http } from '@/shared/api'

export interface Governorate {
  id: number
  nameAr: string
  nameEn: string
  shippingFeePiasters: number
  deliveryDays: number
}

export function useGovernorates() {
  return useQuery({
    queryKey: ['shipping', 'governorates'],
    queryFn: ({ signal }) => http<Governorate[]>('shipping/governorates', { signal }),
    staleTime: 5 * 60_000,
  })
}

const storageKey = 'korner.governorateId'
const listeners = new Set<() => void>()

function read(): number | null {
  try {
    const value = Number(localStorage.getItem(storageKey))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

// The governorate chosen in the cart is remembered, so checkout starts with it filled in.
export const chosenGovernorate = {
  get: read,
  set(id: number | null) {
    try {
      if (id) localStorage.setItem(storageKey, String(id))
      else localStorage.removeItem(storageKey)
    } catch {
      // Storage blocked: the choice lasts until the page is left.
    }
    listeners.forEach((listener) => listener())
  },
}

export function useChosenGovernorate() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    read,
    () => null,
  )
}
