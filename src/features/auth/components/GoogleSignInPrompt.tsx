import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { errorMessage, useSession } from '@/shared/api'
import { Alert } from '@/shared/ui'
import { signInWithGoogle } from '../api'
import { loadGoogleIdentity } from '../google'
import styles from './GoogleSignInPrompt.module.scss'

const seenKey = 'korner.signInPromptSeen'
const delayMs = 2500

function alreadySeen() {
  try {
    return localStorage.getItem(seenKey) === '1'
  } catch {
    return true
  }
}

function markSeen() {
  try {
    localStorage.setItem(seenKey, '1')
  } catch {
    // Without storage it may show again next visit; harmless.
  }
}

interface GoogleSignInPromptProps {
  clientId: string | null | undefined
  /** False on pages where a prompt would get in the way of buying (checkout, payment, sign-in pages). */
  enabled: boolean
  onSignedIn: () => void
}

// First visit only: Google One Tap in the top corner. If the browser can't show it (no Google session,
// blocked third-party sign-in), a small card with Google's button takes its place. Never blocks guest checkout.
export function GoogleSignInPrompt({ clientId, enabled, onSignedIn }: GoogleSignInPromptProps) {
  const { t, i18n } = useTranslation()
  const signedIn = useSession() !== null
  const [fallbackOpen, setFallbackOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buttonHost = useRef<HTMLDivElement>(null)
  const active = enabled && !signedIn && Boolean(clientId)

  useEffect(() => {
    if (!active || alreadySeen()) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const google = await loadGoogleIdentity()
        if (cancelled) return

        google.initialize({
          client_id: clientId!,
          context: 'signin',
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
          use_fedcm_for_prompt: true,
          callback: async ({ credential }) => {
            setFallbackOpen(false)
            try {
              await signInWithGoogle(credential)
              onSignedIn()
            } catch (failure) {
              setError(errorMessage(failure, t))
            }
          },
        })
        markSeen()
        google.prompt((moment) => {
          const closedByUser = ['user_cancel', 'tap_outside'].includes(moment.getSkippedReason?.() ?? '')
          if (moment.isSkippedMoment() && !closedByUser && !cancelled) setFallbackOpen(true)
        })
      } catch {
        // Google unreachable: no prompt, nothing else changes.
      }
    }, delayMs)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.google?.accounts.id.cancel()
    }
  }, [active, clientId, onSignedIn, t])

  useEffect(() => {
    if (!fallbackOpen || !buttonHost.current || !window.google) return
    window.google.accounts.id.renderButton(buttonHost.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 280,
      locale: i18n.language,
    })
  }, [fallbackOpen, i18n.language])

  if (!active || (!fallbackOpen && !error)) return null

  return (
    <aside className={styles.card} aria-labelledby="google-prompt-title">
      <button type="button" className={styles.close} onClick={() => { setFallbackOpen(false); setError(null) }} aria-label={t('common.close')}>
        <X size={18} aria-hidden="true" />
      </button>
      <h2 id="google-prompt-title" className={styles.title}>
        {t('auth.promptTitle')}
      </h2>
      <p className={styles.text}>{t('auth.promptText')}</p>
      {error ? <Alert tone="error" title={error} /> : <div ref={buttonHost} className={styles.googleButton} />}
    </aside>
  )
}
