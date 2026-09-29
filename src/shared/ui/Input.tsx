import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import { Field, type FieldStateProps } from './Field'
import styles from './Field.module.scss'

type InputProps = FieldStateProps & Omit<InputHTMLAttributes<HTMLInputElement>, 'children'>

// Phone numbers, emails and links read left-to-right even on the Arabic site.
const leftToRightTypes = new Set(['tel', 'email', 'url', 'number'])

export function Input({ label, hint, error, success, required, optional, className, type, dir, ...rest }: InputProps) {
  return (
    <Field {...{ label, hint, error, success, required, optional }} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          className={styles.input}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          type={type}
          dir={dir ?? (type && leftToRightTypes.has(type) ? 'ltr' : undefined)}
          {...rest}
        />
      )}
    </Field>
  )
}

type TextareaProps = FieldStateProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>

export function Textarea({ label, hint, error, success, required, optional, className, ...rest }: TextareaProps) {
  return (
    <Field {...{ label, hint, error, success, required, optional }} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          className={styles.input}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          required={required}
          {...rest}
        />
      )}
    </Field>
  )
}

type SelectProps = FieldStateProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> & {
    options: { value: string; label: ReactNode; disabled?: boolean }[]
    placeholder?: string
  }

// A native select: the phone's own picker is the most usable one, and it works with keyboards and screen readers.
export function Select({ label, hint, error, success, required, optional, className, options, placeholder, ...rest }: SelectProps) {
  return (
    <Field {...{ label, hint, error, success, required, optional }} className={className}>
      {({ id, describedBy, invalid }) => (
        <>
          <select
            id={id}
            className={cn(styles.input, styles.select)}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            required={required}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          {!invalid && !success && <ChevronDown size={18} aria-hidden="true" className={styles.chevron} />}
        </>
      )}
    </Field>
  )
}
