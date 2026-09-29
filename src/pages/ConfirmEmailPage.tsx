import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { confirmEmail } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { ButtonLink, EmptyState } from '@/shared/ui'

type State = { status: 'working' } | { status: 'done' } | { status: 'failed'; error: unknown }

// The link in the confirmation email lands here: /auth/emailConfirmation?userId=...&code=...
export function ConfirmEmailPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const userId = params.get('userId')
  const code = params.get('code')
  const [state, setState] = useState<State>({ status: 'working' })
  useDocumentTitle(t('auth.confirmTitle'))

  useEffect(() => {
    if (!userId || !code) return
    let cancelled = false
    confirmEmail(userId, code).then(
      () => !cancelled && setState({ status: 'done' }),
      (error: unknown) => !cancelled && setState({ status: 'failed', error }),
    )
    return () => {
      cancelled = true
    }
  }, [userId, code])

  if (!userId || !code) {
    return (
      <div className="container">
        <EmptyState icon={CircleAlert} title={t('auth.badLinkTitle')} text={t('auth.badLinkText')} action={<Link to="/login">{t('auth.loginLink')}</Link>} />
      </div>
    )
  }

  if (state.status === 'working') {
    return (
      <div className="container" role="status">
        <EmptyState icon={LoaderCircle} title={t('auth.confirming')} />
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="container">
        <EmptyState icon={CircleAlert} title={t('auth.confirmFailedTitle')} text={errorMessage(state.error, t)} action={<Link to="/login">{t('auth.loginLink')}</Link>} />
      </div>
    )
  }

  return (
    <div className="container">
      <EmptyState icon={CircleCheck} title={t('auth.confirmedTitle')} text={t('auth.confirmedText')} action={<ButtonLink to="/login">{t('auth.loginLink')}</ButtonLink>} />
    </div>
  )
}
