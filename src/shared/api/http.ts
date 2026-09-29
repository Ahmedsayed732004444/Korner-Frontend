import { env } from '@/shared/config/env'
import { session, type AuthResponseDto } from './session'

// A backend failure: ProblemDetails with `errors: ["Code", "Description"]`, or validation errors per field.
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, code: string | null, message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

let refreshing: Promise<boolean> | null = null

// One refresh at a time: parallel requests that all got 401 wait for the same new token.
function refreshSession(): Promise<boolean> {
  const current = session.get()
  if (!current) return Promise.resolve(false)

  refreshing ??= send<AuthResponseDto>('auth/refresh', {
    method: 'POST',
    body: { token: current.token, refreshToken: current.refreshToken },
  })
    .then((auth) => {
      session.set(auth)
      return true
    })
    .catch(() => {
      session.clear()
      return false
    })
    .finally(() => {
      refreshing = null
    })

  return refreshing
}

async function send<T>(path: string, options: RequestOptions, token?: string): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${env.apiUrl}/${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  })

  if (response.status === 204) return undefined as T

  const data: unknown = response.headers.get('content-type')?.includes('json') ? await response.json() : null
  if (response.ok) return data as T

  throw toApiError(response.status, data)
}

function toApiError(status: number, data: unknown): ApiError {
  const problem = (data ?? {}) as { title?: string; errors?: unknown }

  if (Array.isArray(problem.errors)) {
    const [code, description] = problem.errors as string[]
    return new ApiError(status, code ?? null, description ?? problem.title ?? 'Request failed')
  }

  if (problem.errors && typeof problem.errors === 'object') {
    return new ApiError(status, 'Validation', problem.title ?? 'Validation failed', problem.errors as Record<string, string[]>)
  }

  return new ApiError(status, status === 429 ? 'TooManyRequests' : null, problem.title ?? 'Request failed')
}

// The only way the app talks to the backend.
export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = session.get()?.token

  try {
    return await send<T>(path, options, token)
  } catch (error) {
    const expired = error instanceof ApiError && error.status === 401 && token
    if (!expired || !(await refreshSession())) throw error
    return send<T>(path, options, session.get()?.token)
  }
}
