export interface PermissionGroup {
  area: string
  permissions: string[]
}

// "orders:read" and "orders:write" become one "orders" group, in the order the API lists them.
export function groupPermissions(permissions: string[]): PermissionGroup[] {
  const groups = new Map<string, string[]>()
  for (const permission of permissions) {
    const area = permission.split(':')[0]
    groups.set(area, [...(groups.get(area) ?? []), permission])
  }
  return [...groups].map(([area, items]) => ({ area, permissions: items }))
}

// Writing something also needs reading it (the API's rule), so ticking "write" ticks "read" and unticking "read" unticks "write".
export function togglePermission(selected: string[], permission: string, on: boolean): string[] {
  const [area, action] = permission.split(':')
  const next = new Set(selected)

  if (on) {
    next.add(permission)
    if (action === 'write') next.add(`${area}:read`)
  } else {
    next.delete(permission)
    if (action === 'read') next.delete(`${area}:write`)
  }

  return [...next]
}
