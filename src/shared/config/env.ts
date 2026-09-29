export const env = {
  apiUrl: (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'https://korner.runasp.net',
  isDevelopment: import.meta.env.DEV,
}
