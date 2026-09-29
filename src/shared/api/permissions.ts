import { useSession } from './session'
import { permissionsOf } from './tokenPermissions'

export function usePermissions() {
  const list = permissionsOf(useSession()?.token)
  return { list, can: (permission: string) => list.includes(permission), isStaff: list.length > 0 }
}
