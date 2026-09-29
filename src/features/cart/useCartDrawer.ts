import { useContext } from 'react'
import { CartDrawerContext, type CartDrawerState } from './cartDrawerContext'

export function useCartDrawer(): CartDrawerState {
  const context = useContext(CartDrawerContext)
  if (!context) throw new Error('useCartDrawer must be used inside CartDrawerProvider')
  return context
}
