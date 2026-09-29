import type { AuthResponseDto } from '@/shared/api'

const defaultExpiresInSeconds = 1800

// The API puts the tokens after "#", which browsers never send to a server. Returns null if anything essential is missing.
export function readOAuthFragment(hash: string): AuthResponseDto | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const token = params.get('token')
  const refreshToken = params.get('refreshToken')
  const id = params.get('userId')
  if (!token || !refreshToken || !id) return null

  return {
    id,
    email: params.get('email') || null,
    firstName: params.get('firstName') ?? '',
    lastName: params.get('lastName') ?? '',
    token,
    expiresIn: Number(params.get('expiresIn')) || defaultExpiresInSeconds,
    refreshToken,
    refreshTokenExpiration: params.get('refreshTokenExpiration') ?? '',
  }
}
