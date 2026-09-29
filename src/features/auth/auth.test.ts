import { describe, expect, it } from 'vitest'
import { readOAuthFragment } from './oauthFragment'
import { isEmail, passwordProblems, safeReturnPath } from './validation'

describe('passwordProblems', () => {
  it('accepts a strong password', () => {
    expect(passwordProblems('Korner@2026')).toEqual([])
  })

  it('lists exactly what is missing', () => {
    expect(passwordProblems('abc')).toEqual(['length', 'upper', 'digit', 'symbol'])
    expect(passwordProblems('ABCDEFG1!')).toEqual(['lower'])
  })
})

describe('isEmail', () => {
  it('checks the shape only', () => {
    expect(isEmail(' mona@example.com ')).toBe(true)
    expect(isEmail('mona@')).toBe(false)
  })
})

describe('safeReturnPath', () => {
  it('keeps same-site paths', () => {
    expect(safeReturnPath('/cart')).toBe('/cart')
  })

  it.each(['https://evil.example', '//evil.example', '/\\evil.example', '', null, undefined])('falls back to home for %s', (value) => {
    expect(safeReturnPath(value)).toBe('/')
  })
})

describe('readOAuthFragment', () => {
  it('reads what the API puts after the #', () => {
    const auth = readOAuthFragment('#token=a.b.c&refreshToken=r%2F1&expiresIn=1800&userId=u1&email=m%40x.com&firstName=Mona&lastName=Adel')
    expect(auth).toMatchObject({ id: 'u1', token: 'a.b.c', refreshToken: 'r/1', email: 'm@x.com', firstName: 'Mona', expiresIn: 1800 })
  })

  it('returns null when a token is missing', () => {
    expect(readOAuthFragment('#userId=u1&token=a')).toBeNull()
    expect(readOAuthFragment('')).toBeNull()
  })
})
