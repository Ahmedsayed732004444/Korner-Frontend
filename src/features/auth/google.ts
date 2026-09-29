// Google Identity Services (One Tap). Loaded on demand, once.
interface PromptMoment {
  isSkippedMoment(): boolean
  getSkippedReason(): string
}

interface GoogleIdentity {
  initialize(options: {
    client_id: string
    callback: (response: { credential: string }) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    context?: 'signin' | 'signup' | 'use'
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
  }): void
  prompt(listener?: (moment: PromptMoment) => void): void
  cancel(): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdentity } }
  }
}

let loading: Promise<GoogleIdentity> | null = null

export function loadGoogleIdentity(): Promise<GoogleIdentity> {
  loading ??= new Promise((resolve, reject) => {
    if (window.google) return resolve(window.google.accounts.id)
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('Google Identity unavailable')))
    script.onerror = () => {
      loading = null
      reject(new Error('Google Identity failed to load'))
    }
    document.head.appendChild(script)
  })
  return loading
}
