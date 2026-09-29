import { describe, expect, it } from 'vitest'
import { isEgyptMobile, normalizeDigits, validateCheckout, type CheckoutFormValues } from './validation'

const valid: CheckoutFormValues = {
  name: 'منى عادل',
  phone: '01012345678',
  email: 'mona@example.com',
  governorateId: 1,
  area: 'مدينة نصر',
  street: 'شارع عباس العقاد',
  building: '12',
  acceptTerms: true,
}

describe('validateCheckout', () => {
  it('accepts a complete form', () => {
    expect(validateCheckout(valid)).toEqual({})
  })

  it('names every empty required field', () => {
    const errors = validateCheckout({ ...valid, name: ' ', email: '', governorateId: null, area: '', street: '', building: '' })
    expect(Object.keys(errors).sort()).toEqual(['area', 'building', 'email', 'governorate', 'name', 'street'])
  })

  it('requires the terms', () => {
    expect(validateCheckout({ ...valid, acceptTerms: false }).acceptTerms).toBe('terms')
  })

  it('rejects a malformed email', () => {
    expect(validateCheckout({ ...valid, email: 'mona@' }).email).toBe('email')
  })
})

describe('phone numbers', () => {
  it.each(['01012345678', '01112345678', '01212345678', '01512345678'])('accepts %s', (phone) => {
    expect(isEgyptMobile(phone)).toBe(true)
  })

  it.each(['0131234567', '010123456', '0101234567890', '02012345678', 'abc'])('rejects %s', (phone) => {
    expect(isEgyptMobile(phone)).toBe(false)
  })

  it('accepts Arabic-Indic digits', () => {
    expect(normalizeDigits('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678')
    expect(isEgyptMobile('٠١٠١٢٣٤٥٦٧٨')).toBe(true)
  })
})
