import { useQuery } from '@tanstack/react-query'
import { http, useSession } from '@/shared/api'

export interface CartSummary {
  id: string | null
  itemsCount: number
  subtotalPiasters: number
}

const cartIdKey = 'korner.cartId'

// A guest's cart lives on the server; the browser only keeps its id and sends it in the X-Cart-Id header.
export const guestCart = {
  id(): string | null {
    try {
      return localStorage.getItem(cartIdKey)
    } catch {
      return null
    }
  },
  remember(id: string | null) {
    try {
      if (id) localStorage.setItem(cartIdKey, id)
      else localStorage.removeItem(cartIdKey)
    } catch {
      // Storage blocked: the cart lasts for this tab only.
    }
  },
}

export function cartHeaders(): Record<string, string> {
  const id = guestCart.id()
  return id ? { 'X-Cart-Id': id } : {}
}

export const cartKeys = {
  cart: (userId: string | null) => ['cart', userId ?? 'guest'] as const,
}

// Keyed by the signed-in user, so signing in or out switches to the right cart without mixing them.
export function useCartSummary() {
  const session = useSession()
  return useQuery({
    queryKey: cartKeys.cart(session?.user.id ?? null),
    queryFn: ({ signal }) => http<CartSummary>('cart', { signal, headers: cartHeaders() }),
    staleTime: 30_000,
  })
}

// After signing in, the guest cart joins the account cart (same variant: the larger quantity wins).
export async function mergeGuestCartIntoAccount() {
  const guestCartId = guestCart.id()
  if (!guestCartId) return

  try {
    await http('cart/merge', { method: 'POST', body: { guestCartId } })
  } finally {
    guestCart.remember(null)
  }
}
