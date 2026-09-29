import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useChangePassword, useProfile, useRequestDeletion, useUpdatePreferences, type Language } from '@/features/account'
import { passwordProblems, signOut } from '@/features/auth'
import { errorMessage } from '@/shared/api'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Button, Checkbox, Input, Select, Skeleton } from '@/shared/ui'
import { PasswordHints } from '../auth/PasswordHints'
import styles from './Account.module.scss'

export function AccountProfilePage() {
  const { t } = useTranslation()
  useDocumentTitle(t('account.profile'))
  const { data: profile, isLoading, error } = useProfile()

  if (isLoading) return <Skeleton style={{ height: 240 }} />
  if (error || !profile) return <Alert tone="error" title={errorMessage(error, t)} />

  return (
    <>
      <h1>{t('account.profile')}</h1>
      <div className={styles.card}>
        <dl className={styles.details}>
          <div>
            <dt>{t('auth.firstName')}</dt>
            <dd>{profile.firstName} {profile.lastName}</dd>
          </div>
          <div>
            <dt>{t('auth.email')}</dt>
            <dd dir="ltr">{profile.email}</dd>
          </div>
        </dl>
      </div>
      <Preferences key={`${profile.preferredLanguage}-${profile.marketingConsent}`} language={profile.preferredLanguage} marketing={profile.marketingConsent} />
      <PasswordCard />
      <DeleteCard />
    </>
  )
}

function Preferences({ language, marketing }: { language: Language; marketing: boolean }) {
  const { t } = useTranslation()
  const [value, setValue] = useState<Language>(language)
  const [consent, setConsent] = useState(marketing)
  const save = useUpdatePreferences()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate({ preferredLanguage: value, marketingConsent: consent })
  }

  return (
    <form className={styles.card} onSubmit={onSubmit}>
      <h2>{t('account.preferences')}</h2>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      {save.isSuccess && <Alert tone="success" title={t('account.saved')} />}
      <Select
        label={t('account.emailLanguage')}
        hint={t('account.emailLanguageHint')}
        value={value}
        onChange={(event) => setValue(event.target.value as Language)}
        options={[
          { value: 'Arabic', label: 'العربية' },
          { value: 'English', label: 'English' },
        ]}
      />
      <Checkbox checked={consent} onChange={(event) => setConsent(event.target.checked)} label={t('checkout.marketing')} />
      <Button type="submit" loading={save.isPending}>
        {t('account.save')}
      </Button>
    </form>
  )
}

function PasswordCard() {
  const { t } = useTranslation()
  const change = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [error, setError] = useState<string>()

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!current) return setError(t('auth.errors.required'))
    if (passwordProblems(next).length > 0) return setError(t('auth.errors.password'))
    change.mutate(
      { currentPassword: current, newPassword: next },
      {
        onSuccess: () => {
          setCurrent('')
          setNext('')
        },
      },
    )
  }

  return (
    <form className={styles.card} onSubmit={onSubmit} noValidate>
      <h2>{t('account.changePassword')}</h2>
      {change.error && <Alert tone="error" title={errorMessage(change.error, t)} />}
      {change.isSuccess && <Alert tone="success" title={t('account.passwordChanged')} />}
      <Input label={t('account.currentPassword')} type="password" value={current} onChange={(event) => { setCurrent(event.target.value); setError(undefined) }} autoComplete="current-password" />
      <Input label={t('auth.newPassword')} type="password" value={next} onChange={(event) => { setNext(event.target.value); setError(undefined) }} error={error} autoComplete="new-password" />
      <PasswordHints password={next} />
      <Button type="submit" loading={change.isPending}>
        {t('auth.resetSubmit')}
      </Button>
    </form>
  )
}

function DeleteCard() {
  const { t } = useTranslation()
  const remove = useRequestDeletion()
  const [confirming, setConfirming] = useState(false)

  const confirm = () => remove.mutate(undefined, { onSuccess: () => void signOut() })

  return (
    <div className={styles.card}>
      <h2>{t('account.deleteTitle')}</h2>
      <p>{t('account.deleteText')}</p>
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}
      {confirming ? (
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => setConfirming(false)}>
            {t('track.keep')}
          </Button>
          <Button onClick={confirm} loading={remove.isPending}>
            {t('account.deleteYes')}
          </Button>
        </div>
      ) : (
        <div>
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            {t('account.deleteTitle')}
          </Button>
        </div>
      )}
    </div>
  )
}
