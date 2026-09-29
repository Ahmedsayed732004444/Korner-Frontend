export const env = {
  apiUrl: ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(/\/$/, ''),
  isDevelopment: import.meta.env.DEV,
}
