import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { readOAuthFragment } from '@/features/auth'
import { session } from '@/shared/api'
import { EmptyState } from '@/shared/ui'

// Google sends the shopper here with the tokens after "#". They are saved, then removed from the address bar and history.
export function OAuthCallbackPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  // Read once at mount: the effect below runs twice in development and the first run clears the address bar.
  const [auth] = useState(() => readOAuthFragment(window.location.hash))

  useEffect(() => {
    if (auth) session.set(auth)
    window.history.replaceState(null, '', window.location.pathname)
    navigate(auth ? '/' : '/login?error=User.InvalidExternalLogin', { replace: true })
  }, [auth, navigate])

  return (
    <div className="container" role="status">
      <EmptyState icon={LoaderCircle} title={t('auth.signingIn')} />
    </div>
  )
}
