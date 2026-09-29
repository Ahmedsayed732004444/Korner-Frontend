import { useSyncExternalStore } from 'react'

export interface SessionUser {
  id: string
  email: string | null
  firstName: string
  lastName: string
}

export interface Session {
  token: string
  refreshToken: string
  expiresAt: number
  user: SessionUser
}

// The auth response from POST auth/login, auth/google and auth/refresh.
export interface AuthResponseDto {
  id: string
  email: string | null
  firstName: string
  lastName: string
  token: string
  expiresIn: number
  refreshToken: string
  refreshTokenExpiration: string
}

const storageKey = 'korner.session'
const listeners = new Set<() => void>()

// The refresh token is kept across visits; the access token is short-lived (30 min) and renewed by the HTTP client.
let current: Session | null = read()

function read(): Session | null {
  try {
    const raw = localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function write(session: Session | null) {
  current = session
  try {
    if (session) localStorage.setItem(storageKey, JSON.stringify(session))
    else localStorage.removeItem(storageKey)
  } catch {
    // Storage blocked: the session lasts for this tab only.
  }
  listeners.forEach((listener) => listener())
}

export const session = {
  get: () => current,
  set: (auth: AuthResponseDto) =>
    write({
      token: auth.token,
      refreshToken: auth.refreshToken,
      expiresAt: Date.now() + auth.expiresIn * 1000,
      user: { id: auth.id, email: auth.email, firstName: auth.firstName, lastName: auth.lastName },
    }),
  clear: () => write(null),
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

// Another tab signing in or out updates this one too.
window.addEventListener('storage', (event) => {
  if (event.key === storageKey) {
    current = read()
    listeners.forEach((listener) => listener())
  }
})

export function useSession() {
  return useSyncExternalStore(session.subscribe, session.get)
}
