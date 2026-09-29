import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { pageWindow } from './pageWindow'
import styles from './Pagination.module.scss'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { t } = useTranslation()
  if (totalPages <= 1) return null

  return (
    <nav aria-label={t('common.pagination')} className={styles.pagination}>
      <button type="button" className={styles.item} onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label={t('common.previousPage')}>
        <ChevronLeft size={20} aria-hidden="true" className="flip-rtl" />
      </button>
      <ul>
        {pageWindow(page, totalPages).map((entry, index) =>
          entry === 'gap' ? (
            <li key={`gap-${index}`} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={entry}>
              <button
                type="button"
                className={cn(styles.item, entry === page && styles.current)}
                onClick={() => onChange(entry)}
                aria-label={t('common.pageNumber', { page: entry })}
                aria-current={entry === page ? 'page' : undefined}
              >
                {entry}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className={styles.item} onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label={t('common.nextPage')}>
        <ChevronRight size={20} aria-hidden="true" className="flip-rtl" />
      </button>
    </nav>
  )
}
