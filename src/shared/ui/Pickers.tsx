import { useId, type ReactNode } from 'react'
import { Minus, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import styles from './Pickers.module.scss'

export interface PickerOption {
  value: string
  label: string
  available?: boolean
}

interface PickerProps<T extends PickerOption> {
  legend: ReactNode
  options: T[]
  value?: string
  onChange: (value: string) => void
}

// Both pickers are real radio groups: arrow keys move between options, and screen readers read "1 of 4, selected".
export function SwatchPicker({ legend, options, value, onChange }: PickerProps<PickerOption & { hex: string }>) {
  const { t } = useTranslation()
  const name = useId()
  const selected = options.find((option) => option.value === value)

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>
        {legend}
        {selected && <span className={styles.selected}>{selected.label}</span>}
      </legend>
      <div className={styles.options}>
        {options.map((option) => {
          const unavailable = option.available === false
          return (
            <label key={option.value} className={cn(styles.swatch, unavailable && styles.unavailable)} title={option.label}>
              <input
                type="radio"
                className={styles.native}
                name={name}
                value={option.value}
                checked={option.value === value}
                disabled={unavailable}
                onChange={() => onChange(option.value)}
                aria-label={unavailable ? `${option.label} — ${t('common.soldOut')}` : option.label}
              />
              <span className={styles.dot} style={{ background: option.hex }} />
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export function SizePicker({ legend, options, value, onChange }: PickerProps<PickerOption>) {
  const { t } = useTranslation()
  const name = useId()

  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const unavailable = option.available === false
          return (
            <label key={option.value} className={cn(styles.chip, unavailable && styles.unavailableChip)}>
              <input
                type="radio"
                className={styles.native}
                name={name}
                value={option.value}
                checked={option.value === value}
                disabled={unavailable}
                onChange={() => onChange(option.value)}
                aria-label={unavailable ? `${option.label} — ${t('common.soldOut')}` : option.label}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

interface QuantityInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  label?: string
}

export function QuantityInput({ value, onChange, min = 1, max = 10, disabled, label }: QuantityInputProps) {
  const { t } = useTranslation()
  const clamp = (next: number) => Math.min(max, Math.max(min, next))

  return (
    <div className={styles.quantity} role="group" aria-label={label ?? t('common.quantity')}>
      <button type="button" className={styles.stepper} onClick={() => onChange(clamp(value - 1))} disabled={disabled || value <= min} aria-label={t('common.decrease')}>
        <Minus size={16} aria-hidden="true" />
      </button>
      <input
        className={styles.value}
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        aria-label={label ?? t('common.quantity')}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (!Number.isNaN(next)) onChange(clamp(next))
        }}
      />
      <button type="button" className={styles.stepper} onClick={() => onChange(clamp(value + 1))} disabled={disabled || value >= max} aria-label={t('common.increase')}>
        <Plus size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
