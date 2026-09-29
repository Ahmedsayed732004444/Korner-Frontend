// The API stores UTC without the "Z", so it is added before the browser converts to local time.
export function asUtc(value: string): Date {
  return new Date(value.endsWith('Z') ? value : `${value}Z`)
}
