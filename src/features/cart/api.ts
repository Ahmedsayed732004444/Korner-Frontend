import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http, session, useSession } from '@/shared/api'

export type CartItemIssue = 'PriceChanged' | 'InsufficientStock' | 'OutOfStock' | 'Unavailable'

export interface CartItem {
  variantId: string
  productId: string
  productNameAr: string
  productNameEn: string
  productSlugAr: string
  productSlugEn: string
  sku: string
  size: string
  colorNameAr: string | null
  colorNameEn: string | null
  colorHexCode: string | null
  imageUrl: string | null
  quantity: number
  unitPricePiasters: number
  compareAtPricePiasters: number | null
  priceWhenAddedPiasters: number
  lineTotalPiasters: number
  fulfillmentType: 'InStock' | 'OnDemand'
  leadTimeDays: number
  /** Only set when fewer pieces are left than the cart holds. */
  availableQuantity: number | null
  issues: CartItemIssue[]
}

export interface FreeShippingProgress {
  thresholdPiasters: number
  amountRemainingPiasters: number
  isReached: boolean
}

export interface Cart {
  id: string | null
  items: CartItem[]
  itemsCount: number
  subtotalPiasters: number
  freeShipping: FreeShippingProgress | null
  shipping: { governorateId: number; shippingFeePiasters: number; isFreeShipping: boolean; amountToFreeShippingPiasters: number | null; deliveryDays: number } | null
  totalPiasters: number | null
  hasPriceChanges: boolean
  hasStockIssues: boolean
  expiresAt: string | null
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
  all: ['cart'] as const,
  cart: (userId: string | null, governorateId: number | null = null) => ['cart', userId ?? 'guest', governorateId] as const,
}

// Keyed by the signed-in user, so signing in or out switches to the right cart without mixing them.
// With a governorate the cart also carries the shipping quote and the total.
export function useCart(governorateId: number | null = null) {
  const current = useSession()
  return useQuery({
    queryKey: cartKeys.cart(current?.user.id ?? null, governorateId),
    queryFn: ({ signal }) => http<Cart>(governorateId ? `cart?governorateId=${governorateId}` : 'cart', { signal, headers: cartHeaders() }),
    staleTime: 30_000,
  })
}

// Every change answers with the whole cart, which becomes the cached cart straight away (no second request).
function useCartMutation<TVariables>(request: (variables: TVariables) => Promise<Cart>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: request,
    onSuccess: (cart) => {
      if (!session.get()) guestCart.remember(cart.id)
      // Cached carts with a shipping quote are stale after any change; the plain cart is replaced in place.
      queryClient.setQueryData(cartKeys.cart(session.get()?.user.id ?? null), cart)
      void queryClient.invalidateQueries({ queryKey: cartKeys.all, predicate: (query) => query.queryKey[2] !== null })
    },
  })
}

export function useAddToCart() {
  return useCartMutation((item: { variantId: string; quantity: number }) =>
    http<Cart>('cart/items', { method: 'POST', body: item, headers: cartHeaders() }),
  )
}

export function useUpdateCartItem() {
  return useCartMutation((change: { variantId: string; quantity: number }) =>
    http<Cart>(`cart/items/${change.variantId}`, { method: 'PUT', body: { quantity: change.quantity }, headers: cartHeaders() }),
  )
}

export function useRemoveCartItem() {
  return useCartMutation((variantId: string) => http<Cart>(`cart/items/${variantId}`, { method: 'DELETE', headers: cartHeaders() }))
}

// The shopper has seen the new prices; checkout refuses a cart whose price changes weren't acknowledged.
export function useAcknowledgeCartChanges() {
  return useCartMutation(() => http<Cart>('cart/acknowledge-changes', { method: 'POST', headers: cartHeaders() }))
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
