import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { http } from '@/shared/api'

export interface StaffUser {
  id: string
  firstName: string
  lastName: string
  email: string
  isDisabled: boolean
  roles: string[]
}

export interface UserInput {
  firstName: string
  lastName: string
  email: string
  roles: string[]
}

export interface Role {
  id: string
  name: string
  isDeleted: boolean
}

export interface RoleDetails extends Role {
  permissions: string[]
}

// The two built-in roles can't be edited or disabled; the API refuses it too.
export const protectedRoles = ['Admin', 'Member']

const keys = {
  users: ['admin', 'access', 'users'] as const,
  roles: ['admin', 'access', 'roles'] as const,
  role: (id: string) => ['admin', 'access', 'role', id] as const,
  permissions: ['admin', 'access', 'permissions'] as const,
}

export function useStaffUsers() {
  return useQuery({ queryKey: keys.users, queryFn: ({ signal }) => http<StaffUser[]>('admin/users', { signal }) })
}

export function useRoles() {
  return useQuery({ queryKey: keys.roles, queryFn: ({ signal }) => http<Role[]>('admin/roles?includeDisabled=true', { signal }) })
}

export function useRole(id: string | null) {
  return useQuery({ queryKey: keys.role(id ?? ''), queryFn: ({ signal }) => http<RoleDetails>(`admin/roles/${id}`, { signal }), enabled: id !== null })
}

export function usePermissionList() {
  return useQuery({ queryKey: keys.permissions, queryFn: ({ signal }) => http<string[]>('admin/roles/permissions', { signal }), staleTime: 60 * 60_000 })
}

function useAccessAction<TVariables>(request: (variables: TVariables) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'access'] }),
  })
}

export function useSaveUser() {
  return useAccessAction((change: { id: string | null; input: UserInput; password: string }) =>
    change.id
      ? http<void>(`admin/users/${change.id}`, { method: 'PUT', body: change.input })
      : http<StaffUser>('admin/users', { method: 'POST', body: { ...change.input, password: change.password } }),
  )
}

export function useToggleUser() {
  return useAccessAction((id: string) => http<void>(`admin/users/${id}/toggle-status`, { method: 'PUT' }))
}

export function useUnlockUser() {
  return useAccessAction((id: string) => http<void>(`admin/users/${id}/unlock`, { method: 'PUT' }))
}

export function useSaveRole() {
  return useAccessAction((change: { id: string | null; name: string; permissions: string[] }) =>
    change.id
      ? http<void>(`admin/roles/${change.id}`, { method: 'PUT', body: { name: change.name, permissions: change.permissions } })
      : http<RoleDetails>('admin/roles', { method: 'POST', body: { name: change.name, permissions: change.permissions } }),
  )
}

export function useToggleRole() {
  return useAccessAction((id: string) => http<void>(`admin/roles/${id}/toggle-status`, { method: 'PUT' }))
}
