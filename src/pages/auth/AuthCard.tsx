import type { ReactNode } from 'react'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import styles from './AuthCard.module.scss'

interface AuthCardProps {
  title: string
  text?: string
  children: ReactNode
  footer?: ReactNode
}

// One frame for every sign-in page, so they look and behave the same.
export function AuthCard({ title, text, children, footer }: AuthCardProps) {
  useDocumentTitle(title)

  return (
    <div className="container">
      <div className={styles.card}>
        <h1>{title}</h1>
        {text && <p className={styles.text}>{text}</p>}
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
