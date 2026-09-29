import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { formatPiasters } from '@/shared/lib/money'
import styles from './Display.module.scss'

interface PriceProps {
  /** Integer piasters, exactly as the API sends them. */
  amount: number
  compareAt?: number | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Price({ amount, compareAt, size = 'md', className }: PriceProps) {
  const { t, i18n } = useTranslation()
  const onSale = compareAt != null && compareAt > amount

  return (
    <span className={cn(styles.price, styles[`price-${size}`], className)}>
      <span className={cn(styles.current, onSale && styles.onSale)}>{formatPiasters(amount, i18n.language)}</span>
      {onSale && (
        <s className={styles.compare}>
          <span className="visually-hidden">{t('common.was')} </span>
          {formatPiasters(compareAt, i18n.language)}
        </s>
      )}
    </span>
  )
}

interface SectionTitleProps {
  eyebrow?: ReactNode
  title: ReactNode
  as?: 'h1' | 'h2'
  align?: 'center' | 'start'
}

export function SectionTitle({ eyebrow, title, as: Heading = 'h2', align = 'center' }: SectionTitleProps) {
  return (
    <div className={cn(styles.sectionTitle, align === 'start' && styles.start)}>
      {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
      <Heading className={styles.heading}>{title}</Heading>
    </div>
  )
}

export interface Crumb {
  label: ReactNode
  to?: string
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('common.breadcrumb')} className={styles.breadcrumb}>
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1
          return (
            <li key={index}>
              {last || !item.to ? (
                <span className={styles.crumbCurrent} aria-current={last ? 'page' : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className={styles.crumbLink}>
                  {item.label}
                </Link>
              )}
              {!last && <ChevronRight size={14} aria-hidden="true" className={cn(styles.separator, 'flip-rtl')} />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// Temporary logo until the real one arrives; replace only here.
export function Logo() {
  const { t } = useTranslation()
  return (
    <Link to="/" className={styles.logo} aria-label={t('brand.name')}>
      Korner
      <span className={styles.logoDot} aria-hidden="true" />
    </Link>
  )
}
