// The API puts the staff member's permissions in the access token ("permissions": ["orders:read", ...]).
// The browser only uses them to decide what to show; the API checks them again on every request.
export function permissionsOf(token: string | undefined): string[] {
  if (!token) return []

  try {
    const payload = token.split('.')[1]
    const json = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    const claim = (JSON.parse(json) as { permissions?: string | string[] }).permissions
    return Array.isArray(claim) ? claim : claim ? [claim] : []
  } catch {
    return []
  }
}
