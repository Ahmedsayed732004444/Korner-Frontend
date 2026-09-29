import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { panelId, tabId } from './tabIds'
import styles from './Tabs.module.scss'

export interface TabItem {
  id: string
  label: ReactNode
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  label: string
  /** Groups the ids so several Tabs on one page don't clash. */
  idPrefix: string
  align?: 'center' | 'start'
}

// Arrow keys move between tabs (left/right follow the reading direction), Home/End jump to the ends.
export function Tabs({ items, value, onChange, label, idPrefix, align = 'center' }: TabsProps) {
  const list = useRef<HTMLDivElement>(null)

  const move = (event: KeyboardEvent, index: number) => {
    const rtl = getComputedStyle(event.currentTarget).direction === 'rtl'
    const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key]
    let next = step === undefined ? -1 : (index + step + items.length) % items.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = items.length - 1
    if (next < 0) return

    event.preventDefault()
    onChange(items[next].id)
    list.current?.querySelector<HTMLElement>(`#${CSS.escape(tabId(idPrefix, items[next].id))}`)?.focus()
  }

  return (
    <div ref={list} role="tablist" aria-label={label} className={cn(styles.list, align === 'start' && styles.start)}>
      {items.map((item, index) => {
        const selected = item.id === value
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={tabId(idPrefix, item.id)}
            aria-selected={selected}
            aria-controls={panelId(idPrefix, item.id)}
            tabIndex={selected ? 0 : -1}
            className={cn(styles.tab, selected && styles.selected)}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => move(event, index)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
