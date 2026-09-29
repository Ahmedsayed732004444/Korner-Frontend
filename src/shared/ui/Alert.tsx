import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '@/shared/lib/cn'
import styles from './Feedback.module.scss'

export type Tone = 'info' | 'success' | 'warning' | 'error'

const icons = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert }

interface AlertProps {
  tone?: Tone
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}

// Errors interrupt screen readers right away; everything else is announced politely.
export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const Icon = icons[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn(styles.alert, styles[tone], className)}>
      <Icon size={20} strokeWidth={2} aria-hidden="true" className={styles.alertIcon} />
      <div className={styles.alertBody}>
        <p className={styles.alertTitle}>{title}</p>
        {children && <p className={styles.alertText}>{children}</p>}
        {action && <div className={styles.alertAction}>{action}</div>}
      </div>
    </div>
  )
}
