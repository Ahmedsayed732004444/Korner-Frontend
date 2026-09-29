import { describe, expect, it } from 'vitest'
import { permissionsOf } from './tokenPermissions'

function token(payload: object) {
  const encode = (value: object) => btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`
}

describe('permissionsOf', () => {
  it('reads the permissions list', () => {
    expect(permissionsOf(token({ permissions: ['orders:read', 'orders:write'] }))).toEqual(['orders:read', 'orders:write'])
  })

  it('accepts a single permission, which the API sends as a plain string', () => {
    expect(permissionsOf(token({ permissions: 'reports:read' }))).toEqual(['reports:read'])
  })

  it('gives none for customers and broken tokens', () => {
    expect(permissionsOf(token({ sub: 'u1' }))).toEqual([])
    expect(permissionsOf('not-a-token')).toEqual([])
    expect(permissionsOf(undefined)).toEqual([])
  })
})
