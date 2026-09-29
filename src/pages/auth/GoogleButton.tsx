import { useTranslation } from 'react-i18next'
import { googleRedirectUrl } from '@/features/auth'
import { Button } from '@/shared/ui'
import styles from './AuthCard.module.scss'

// A full-page trip to Google and back; it works on every browser, unlike One Tap which can be blocked.
export function GoogleButton() {
  const { t } = useTranslation()

  return (
    <>
      <Button variant="secondary" fullWidth onClick={() => window.location.assign(googleRedirectUrl)}>
        {t('auth.google')}
      </Button>
      <div className={styles.divider}>{t('auth.or')}</div>
    </>
  )
}
