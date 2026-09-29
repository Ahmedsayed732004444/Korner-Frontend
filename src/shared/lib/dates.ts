// The API stores UTC without the "Z", so it is added before the browser converts to local time.
export function asUtc(value: string): Date {
  return new Date(value.endsWith('Z') ? value : `${value}Z`)
}

const pad = (value: number) => String(value).padStart(2, '0')

// <input type="datetime-local"> works in local time without a zone; the API wants an exact moment.
export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = asUtc(iso)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
