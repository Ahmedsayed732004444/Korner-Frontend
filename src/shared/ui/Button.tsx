import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Spinner } from './Spinner'
import styles from './Button.module.scss'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  /** Icon-only buttons must pass an `aria-label`. */
  iconOnly?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  iconOnly = false,
  startIcon,
  endIcon,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        styles.button,
        styles[variant],
        size !== 'md' && styles[size],
        fullWidth && styles.fullWidth,
        iconOnly && styles.iconOnly,
        loading && styles.loading,
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <span className={styles.content}>
        {startIcon}
        {children}
        {endIcon}
      </span>
      {loading && <Spinner size="sm" tone={variant === 'primary' ? 'inverse' : 'default'} className={styles.spinner} />}
    </button>
  )
}
