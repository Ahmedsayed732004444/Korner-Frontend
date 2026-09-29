import type { CSSProperties } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import styles from './Feedback.module.scss'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  tone?: 'default' | 'inverse'
  className?: string
}

export function Spinner({ size = 'md', tone = 'default', className }: SpinnerProps) {
  const { t } = useTranslation()
  return (
    <span role="status" className={cn(styles.spinner, styles[`spinner-${size}`], tone === 'inverse' && styles.inverse, className)}>
      <span className="visually-hidden">{t('common.loading')}</span>
    </span>
  )
}

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={cn(styles.skeleton, className)} style={style} />
}
