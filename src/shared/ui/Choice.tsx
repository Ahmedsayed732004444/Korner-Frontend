import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './Field.module.scss'

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
  hint?: ReactNode
  invalid?: boolean
}

function Choice({ type, label, hint, invalid, disabled, className, ...rest }: ChoiceProps & { type: 'checkbox' | 'radio' }) {
  return (
    <label className={cn(styles.choice, disabled && styles.disabled, className)}>
      <input type={type} className={styles.choiceInput} disabled={disabled} aria-invalid={invalid || undefined} {...rest} />
      <span className={styles.choiceText}>
        <span>{label}</span>
        {hint && <span className={styles.choiceHint}>{hint}</span>}
      </span>
    </label>
  )
}

export function Checkbox(props: ChoiceProps) {
  return <Choice type="checkbox" {...props} />
}

export function Radio(props: ChoiceProps) {
  return <Choice type="radio" {...props} />
}

export function ChoiceGroup({ legend, children }: { legend: ReactNode; children: ReactNode }) {
  return (
    <fieldset className={styles.group}>
      <legend className={cn(styles.label, styles.legend)}>{legend}</legend>
      {children}
    </fieldset>
  )
}
