import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import styles from './Drawer.module.scss'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  /** Which edge it slides from, following the reading direction. `top` is a full-width sheet (search). */
  side?: 'start' | 'end' | 'top'
  children: ReactNode
  className?: string
}

// Built on the native <dialog>: it traps focus, closes on Escape and hides the rest of the page from screen readers.
export function Drawer({ open, onClose, title, side = 'start', children, className }: DrawerProps) {
  const { t } = useTranslation()
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    if (!open && element.open) element.close()
  }, [open])

  return (
    <dialog
      ref={dialog}
      className={cn(styles.drawer, styles[side], className)}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <div className={styles.panel}>
        <header className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label={t('common.close')}>
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </div>
    </dialog>
  )
}
