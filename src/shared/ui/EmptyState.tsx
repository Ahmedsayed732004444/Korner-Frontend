import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import styles from './Feedback.module.scss'

interface EmptyStateProps {
  icon: LucideIcon
  title: ReactNode
  text?: ReactNode
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Icon size={56} strokeWidth={1.25} aria-hidden="true" className={styles.emptyIcon} />
      <h2 className={styles.emptyTitle}>{title}</h2>
      {text && <p className={styles.emptyText}>{text}</p>}
      {action && <div className={styles.emptyAction}>{action}</div>}
    </div>
  )
}
