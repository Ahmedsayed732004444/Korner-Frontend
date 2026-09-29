import { describe, expect, it } from 'vitest'
import { groupPermissions, togglePermission } from './permissionGroups'

describe('groupPermissions', () => {
  it('groups by area and keeps the order', () => {
    expect(groupPermissions(['catalog:read', 'catalog:write', 'payments:read', 'payments:refund'])).toEqual([
      { area: 'catalog', permissions: ['catalog:read', 'catalog:write'] },
      { area: 'payments', permissions: ['payments:read', 'payments:refund'] },
    ])
  })
})

describe('togglePermission', () => {
  it('ticking write also ticks read', () => {
    expect(togglePermission([], 'orders:write', true).sort()).toEqual(['orders:read', 'orders:write'])
  })

  it('unticking read also unticks write', () => {
    expect(togglePermission(['orders:read', 'orders:write', 'catalog:read'], 'orders:read', false)).toEqual(['catalog:read'])
  })

  it('leaves other areas alone', () => {
    expect(togglePermission(['catalog:read'], 'orders:read', true).sort()).toEqual(['catalog:read', 'orders:read'])
  })
})
