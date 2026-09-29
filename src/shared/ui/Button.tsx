import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
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

interface ButtonLinkProps {
  /** An in-app path ("/c/shoes") or a full web address. */
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  startIcon?: ReactNode
  endIcon?: ReactNode
  className?: string
  onClick?: () => void
  children: ReactNode
}

// A link that looks like a button, so navigation stays a real link (right-click, open in new tab, screen readers).
export function ButtonLink({ to, variant = 'primary', size = 'md', fullWidth = false, startIcon, endIcon, className, onClick, children }: ButtonLinkProps) {
  const classes = cn(styles.button, styles[variant], size !== 'md' && styles[size], fullWidth && styles.fullWidth, className)
  const content = (
    <span className={styles.content}>
      {startIcon}
      {children}
      {endIcon}
    </span>
  )

  return /^https?:\/\//.test(to) ? (
    <a href={to} className={classes} rel="noopener noreferrer" onClick={onClick}>
      {content}
    </a>
  ) : (
    <Link to={to} className={classes} onClick={onClick}>
      {content}
    </Link>
  )
}
