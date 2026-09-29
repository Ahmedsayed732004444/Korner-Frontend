import { createContext } from 'react'

export interface CartDrawerState {
  isOpen: boolean
  /** True right after something was added, so the drawer can say so. */
  justAdded: boolean
  open: (options?: { justAdded?: boolean }) => void
  close: () => void
}

export const CartDrawerContext = createContext<CartDrawerState | null>(null)
