import { useId, type ReactNode } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import styles from './Field.module.scss'

export interface FieldStateProps {
  label: ReactNode
  hint?: ReactNode
  /** Shown under the field; marks it invalid for screen readers. */
  error?: ReactNode
  /** Shown only after a user action, e.g. "Saved". */
  success?: ReactNode
  required?: boolean
  optional?: boolean
}

interface FieldProps extends FieldStateProps {
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode
  className?: string
}

// Wires label, hint and message to the control with ids, so every input gets the same accessible structure.
export function Field({ label, hint, error, success, required, optional, children, className }: FieldProps) {
  const { t } = useTranslation()
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const messageId = error || success ? `${id}-message` : undefined
  const describedBy = [hintId, messageId].filter(Boolean).join(' ') || undefined
  const invalid = Boolean(error)

  return (
    <div className={cn(styles.field, success && !invalid && styles.success, className)}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
        {optional && <span className={styles.optional}>({t('common.optional')})</span>}
      </label>
      <div className={styles.control}>
        {children({ id, describedBy, invalid })}
        {(invalid || success) && (
          <span className={styles.statusIcon} aria-hidden="true">
            {invalid ? <CircleAlert size={18} /> : <CircleCheck size={18} />}
          </span>
        )}
      </div>
      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {(error || success) && (
        <p id={messageId} className={styles.message} role={invalid ? 'alert' : undefined}>
          {error ?? success}
        </p>
      )}
    </div>
  )
}
