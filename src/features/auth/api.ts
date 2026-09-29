import { http, session, type AuthResponseDto } from '@/shared/api'

export async function signInWithGoogle(credential: string) {
  const auth = await http<AuthResponseDto>('auth/google', { method: 'POST', body: { credential } })
  session.set(auth)
  return auth
}

export async function signOut() {
  const current = session.get()
  session.clear()
  if (!current) return

  try {
    await http('auth/revoke-refresh-token', { method: 'POST', body: { token: current.token, refreshToken: current.refreshToken } })
  } catch {
    // Already signed out locally; the refresh token expires on its own.
  }
}
