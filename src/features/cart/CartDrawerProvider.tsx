import { useMemo, useState, type ReactNode } from 'react'
import { CartDrawerContext, type CartDrawerState } from './cartDrawerContext'

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [justAdded, setJustAdded] = useState(false)

  const value = useMemo<CartDrawerState>(
    () => ({
      isOpen,
      justAdded,
      open: (options) => {
        setJustAdded(options?.justAdded ?? false)
        setOpen(true)
      },
      close: () => setOpen(false),
    }),
    [isOpen, justAdded],
  )

  return <CartDrawerContext.Provider value={value}>{children}</CartDrawerContext.Provider>
}
