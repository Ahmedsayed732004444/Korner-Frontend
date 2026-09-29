import { useTranslation } from 'react-i18next'
import { passwordProblems, type PasswordProblem } from '@/features/auth'
import styles from './AuthCard.module.scss'

const rules: PasswordProblem[] = ['length', 'lower', 'upper', 'digit', 'symbol']

// The rules stay visible and tick off as the shopper types, instead of an error after submitting.
export function PasswordHints({ password }: { password: string }) {
  const { t } = useTranslation()
  const missing = passwordProblems(password)

  return (
    <ul className={styles.hints} aria-label={t('auth.passwordRules')}>
      {rules.map((rule) => (
        <li key={rule} className={missing.includes(rule) ? undefined : styles.met}>
          {missing.includes(rule) ? '○' : '✓'} {t(`auth.rules.${rule}`)}
        </li>
      ))}
    </ul>
  )
}
