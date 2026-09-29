import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { isEmail, resendConfirmationEmail, safeReturnPath, signInWithPassword } from '@/features/auth'
import { ApiError, errorMessage, useSession } from '@/shared/api'
import { Alert, Button, Input } from '@/shared/ui'
import { AuthCard } from './auth/AuthCard'
import { GoogleButton } from './auth/GoogleButton'

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const current = useSession()
  const returnTo = safeReturnPath(params.get('returnTo'))
  const redirectError = params.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const [resent, setResent] = useState(false)

  if (current && !pending) return <Navigate to={returnTo} replace />

  const notConfirmed = failure instanceof ApiError && failure.code === 'User.EmailNotConfirmed'

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const missingEmail = !isEmail(email) ? t('auth.errors.email') : undefined
    const missingPassword = !password ? t('auth.errors.required') : undefined
    setEmailError(missingEmail)
    setPasswordError(missingPassword)
    if (missingEmail || missingPassword) return

    setPending(true)
    setFailure(null)
    try {
      await signInWithPassword(email, password)
      navigate(returnTo, { replace: true })
    } catch (error) {
      setFailure(error)
    } finally {
      setPending(false)
    }
  }

  const resend = async () => {
    try {
      await resendConfirmationEmail(email)
      setResent(true)
    } catch (error) {
      setFailure(error)
    }
  }

  return (
    <AuthCard
      title={t('auth.loginTitle')}
      text={t('auth.loginText')}
      footer={
        <>
          <span>
            {t('auth.noAccount')} <Link to={`/register${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>{t('auth.registerLink')}</Link>
          </span>
        </>
      }
    >
      {redirectError && !failure && <Alert tone="error" title={t(`errors.${redirectError}`, { defaultValue: t('errors.generic') })} />}
      {failure != null && <Alert tone="error" title={errorMessage(failure, t)} />}
      {resent && <Alert tone="success" title={t('auth.confirmationSent')} />}
      {notConfirmed && !resent && (
        <Button variant="secondary" onClick={() => void resend()}>
          {t('auth.resendConfirmation')}
        </Button>
      )}

      <GoogleButton />

      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setEmailError(undefined)
          }}
          error={emailError}
          autoComplete="email"
          required
        />
        <Input
          label={t('auth.password')}
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setPasswordError(undefined)
          }}
          error={passwordError}
          autoComplete="current-password"
          required
        />
        <Link to="/auth/forgetPassword">{t('auth.forgot')}</Link>
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t('auth.loginSubmit')}
        </Button>
      </form>
    </AuthCard>
  )
}
