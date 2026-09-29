import { useState, type FormEvent } from 'react'
import { CircleCheck, MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { isEmail, passwordProblems, requestPasswordReset, resetPassword } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { Alert, Button, ButtonLink, EmptyState, Input } from '@/shared/ui'
import { AuthCard } from './auth/AuthCard'
import { PasswordHints } from './auth/PasswordHints'

// Two steps on one route: without a code it asks for the email; the emailed link (?email=&code=) opens the new-password form.
export function ForgetPasswordPage() {
  const [params] = useSearchParams()
  const email = params.get('email')
  const code = params.get('code')

  return email && code ? <ResetStep email={email} code={code} /> : <RequestStep />
}

function RequestStep() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const [sent, setSent] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!isEmail(email)) return setError(t('auth.errors.email'))

    setPending(true)
    setFailure(null)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (caught) {
      setFailure(caught)
    } finally {
      setPending(false)
    }
  }

  if (sent) {
    return (
      <div className="container">
        <EmptyState icon={MailCheck} title={t('auth.resetSentTitle')} text={t('auth.resetSentText')} action={<Link to="/login">{t('auth.loginLink')}</Link>} />
      </div>
    )
  }

  return (
    <AuthCard title={t('auth.forgotTitle')} text={t('auth.forgotText')} footer={<Link to="/login">{t('auth.backToLogin')}</Link>}>
      {failure != null && <Alert tone="error" title={errorMessage(failure, t)} />}
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Input
          label={t('auth.email')}
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            setError(undefined)
          }}
          error={error}
          autoComplete="email"
          required
        />
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t('auth.sendLink')}
        </Button>
      </form>
    </AuthCard>
  )
}

function ResetStep({ email, code }: { email: string; code: string }) {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const [done, setDone] = useState(false)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (passwordProblems(password).length > 0) return setError(t('auth.errors.password'))

    setPending(true)
    setFailure(null)
    try {
      await resetPassword({ email, code, newPassword: password })
      setDone(true)
    } catch (caught) {
      setFailure(caught)
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <div className="container">
        <EmptyState icon={CircleCheck} title={t('auth.resetDoneTitle')} text={t('auth.resetDoneText')} action={<ButtonLink to="/login">{t('auth.loginLink')}</ButtonLink>} />
      </div>
    )
  }

  return (
    <AuthCard title={t('auth.newPasswordTitle')} text={email}>
      {failure != null && <Alert tone="error" title={errorMessage(failure, t)} />}
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Input
          label={t('auth.newPassword')}
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setError(undefined)
          }}
          error={error}
          autoComplete="new-password"
          required
        />
        <PasswordHints password={password} />
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t('auth.resetSubmit')}
        </Button>
      </form>
    </AuthCard>
  )
}
