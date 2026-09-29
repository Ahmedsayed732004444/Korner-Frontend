const simpleEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordSymbol = /[!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?]/

export function isEmail(value: string): boolean {
  return simpleEmail.test(value.trim())
}

export type PasswordProblem = 'length' | 'lower' | 'upper' | 'digit' | 'symbol'

// The same rule as the API (8+ characters with lower, upper, digit and symbol), so the shopper sees exactly what is missing.
export function passwordProblems(password: string): PasswordProblem[] {
  const problems: PasswordProblem[] = []
  if (password.length < 8) problems.push('length')
  if (!/[a-z]/.test(password)) problems.push('lower')
  if (!/[A-Z]/.test(password)) problems.push('upper')
  if (!/[0-9]/.test(password)) problems.push('digit')
  if (!passwordSymbol.test(password)) problems.push('symbol')
  return problems
}

// Only same-site paths are allowed as a place to return to after signing in.
export function safeReturnPath(value: string | null | undefined): string {
  return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : '/'
}
