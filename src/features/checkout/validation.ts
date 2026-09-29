export interface CheckoutFormValues {
  name: string
  phone: string
  email: string
  governorateId: number | null
  area: string
  street: string
  building: string
  acceptTerms: boolean
}

export type CheckoutField = 'name' | 'phone' | 'email' | 'governorate' | 'area' | 'street' | 'building' | 'acceptTerms'

const egyptMobile = /^01[0125]\d{8}$/
const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Arabic-Indic digits are what many Egyptian keyboards type; the API wants Latin ones.
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
}

export function isEgyptMobile(value: string): boolean {
  return egyptMobile.test(normalizeDigits(value).trim())
}

// The server checks everything again; this only saves a round trip and tells the shopper which field to fix.
export function validateCheckout(values: CheckoutFormValues): Partial<Record<CheckoutField, string>> {
  const errors: Partial<Record<CheckoutField, string>> = {}

  if (!values.name.trim()) errors.name = 'required'
  if (!values.phone.trim()) errors.phone = 'required'
  else if (!isEgyptMobile(values.phone)) errors.phone = 'phone'
  if (!values.email.trim()) errors.email = 'required'
  else if (!simpleEmail.test(values.email.trim())) errors.email = 'email'
  if (values.governorateId === null) errors.governorate = 'required'
  if (!values.area.trim()) errors.area = 'required'
  if (!values.street.trim()) errors.street = 'required'
  if (!values.building.trim()) errors.building = 'required'
  if (!values.acceptTerms) errors.acceptTerms = 'terms'

  return errors
}
