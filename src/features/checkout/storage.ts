const keyName = 'korner.checkoutKey'
const lastOrderName = 'korner.lastOrder'

export interface LastOrder {
  number: number
  phone: string
}

function read(storage: () => Storage, name: string): string | null {
  try {
    return storage().getItem(name)
  } catch {
    return null
  }
}

function write(storage: () => Storage, name: string, value: string | null) {
  try {
    if (value) storage().setItem(name, value)
    else storage().removeItem(name)
  } catch {
    // Storage blocked: a refresh just starts a new checkout.
  }
}

// One key per checkout attempt: sending the same key again returns the same order, so a double click or a retry never orders twice.
export const checkoutKey = {
  get(): string {
    const existing = read(() => sessionStorage, keyName)
    if (existing) return existing
    const created = crypto.randomUUID()
    write(() => sessionStorage, keyName, created)
    return created
  },
  clear() {
    write(() => sessionStorage, keyName, null)
  },
}

// Paymob sends the shopper back without our order number, so it's kept here (with the phone that proves it's theirs).
export const lastOrder = {
  get(): LastOrder | null {
    const raw = read(() => localStorage, lastOrderName)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw) as Partial<LastOrder>
      return typeof parsed.number === 'number' && typeof parsed.phone === 'string' ? { number: parsed.number, phone: parsed.phone } : null
    } catch {
      return null
    }
  },
  set(order: LastOrder) {
    write(() => localStorage, lastOrderName, JSON.stringify(order))
  },
}
