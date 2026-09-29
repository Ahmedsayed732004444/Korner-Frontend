import type { PickerOption } from './Pickers'
import { cn } from '@/shared/lib/cn'
import styles from './Pickers.module.scss'

interface MultiPickerProps {
  legend: string
  options: PickerOption[]
  values: string[]
  onChange: (values: string[]) => void
}

const toggle = (values: string[], value: string) =>
  values.includes(value) ? values.filter((item) => item !== value) : [...values, value]

// Size chips where several can be on at once (filters). Same look as the single-choice SizePicker.
export function SizeMultiPicker({ legend, options, values, onChange }: MultiPickerProps) {
  return (
    <fieldset className={styles.group}>
      <legend className="visually-hidden">{legend}</legend>
      <div className={styles.options}>
        {options.map((option) => (
          <label key={option.value} className={cn(styles.chip)}>
            <input
              type="checkbox"
              className={styles.native}
              checked={values.includes(option.value)}
              onChange={() => onChange(toggle(values, option.value))}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
