import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './Feedback.module.scss'

export type BadgeTone = 'neutral' | 'dark' | 'sale' | 'success' | 'warning' | 'error' | 'info'

export function Badge({ tone = 'neutral', children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={cn(styles.badge, styles[`badge-${tone}`], className)}>{children}</span>
}
