import { http, session, type AuthResponseDto } from '@/shared/api'
import { env } from '@/shared/config/env'

export async function signInWithGoogle(credential: string) {
  const auth = await http<AuthResponseDto>('auth/google', { method: 'POST', body: { credential } })
  session.set(auth)
  return auth
}

export async function signInWithPassword(email: string, password: string) {
  const auth = await http<AuthResponseDto>('auth/login', { method: 'POST', body: { email: email.trim(), password } })
  session.set(auth)
  return auth
}

export function register(input: { email: string; password: string; firstName: string; lastName: string }) {
  return http<void>('auth/register', {
    method: 'POST',
    body: { email: input.email.trim(), password: input.password, firstName: input.firstName.trim(), lastName: input.lastName.trim() },
  })
}

export function confirmEmail(userId: string, code: string) {
  return http<void>('auth/confirm-email', { method: 'POST', body: { userId, code } })
}

export function resendConfirmationEmail(email: string) {
  return http<void>('auth/resend-confirmation-email', { method: 'POST', body: { email: email.trim() } })
}

export function requestPasswordReset(email: string) {
  return http<void>('auth/forget-password', { method: 'POST', body: { email: email.trim() } })
}

export function resetPassword(input: { email: string; code: string; newPassword: string }) {
  return http<void>('auth/reset-password', { method: 'POST', body: input })
}

// The redirect flow: the API sends the browser to Google and back to /oauth/callback with the tokens in the #fragment.
export const googleRedirectUrl = `${env.apiUrl}/auth/google-login`

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
