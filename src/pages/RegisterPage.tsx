import { useState, type FormEvent } from 'react'
import { MailCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { isEmail, passwordProblems, register, safeReturnPath } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { Alert, Button, EmptyState, Input } from '@/shared/ui'
import { AuthCard } from './auth/AuthCard'
import { GoogleButton } from './auth/GoogleButton'
import { PasswordHints } from './auth/PasswordHints'

type Field = 'firstName' | 'lastName' | 'email' | 'password'

export function RegisterPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const returnTo = safeReturnPath(params.get('returnTo'))

  const [values, setValues] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState<unknown>(null)
  const [done, setDone] = useState(false)

  const set = (field: Field) => (event: { target: { value: string } }) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const found: Partial<Record<Field, string>> = {}
    if (!values.firstName.trim()) found.firstName = t('auth.errors.required')
    if (!values.lastName.trim()) found.lastName = t('auth.errors.required')
    if (!isEmail(values.email)) found.email = t('auth.errors.email')
    if (passwordProblems(values.password).length > 0) found.password = t('auth.errors.password')
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setPending(true)
    setFailure(null)
    try {
      await register(values)
      setDone(true)
    } catch (error) {
      setFailure(error)
    } finally {
      setPending(false)
    }
  }

  if (done) {
    return (
      <div className="container">
        <EmptyState
          icon={MailCheck}
          title={t('auth.checkEmailTitle')}
          text={t('auth.checkEmailText', { email: values.email.trim() })}
          action={<Link to={`/login${returnTo !== '/' ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}>{t('auth.loginLink')}</Link>}
        />
      </div>
    )
  }

  return (
    <AuthCard
      title={t('auth.registerTitle')}
      text={t('auth.registerText')}
      footer={
        <span>
          {t('auth.haveAccount')} <Link to="/login">{t('auth.loginLink')}</Link>
        </span>
      }
    >
      {failure != null && <Alert tone="error" title={errorMessage(failure, t)} />}
      <GoogleButton />
      <form onSubmit={(event) => void onSubmit(event)} noValidate>
        <Input label={t('auth.firstName')} value={values.firstName} onChange={set('firstName')} error={errors.firstName} autoComplete="given-name" required />
        <Input label={t('auth.lastName')} value={values.lastName} onChange={set('lastName')} error={errors.lastName} autoComplete="family-name" required />
        <Input label={t('auth.email')} type="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
        <Input label={t('auth.password')} type="password" value={values.password} onChange={set('password')} error={errors.password} autoComplete="new-password" required />
        <PasswordHints password={values.password} />
        <Button type="submit" size="lg" fullWidth loading={pending}>
          {t('auth.registerSubmit')}
        </Button>
      </form>
    </AuthCard>
  )
}
