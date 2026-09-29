import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorMessage } from '@/shared/api'
import { Alert, Button } from '@/shared/ui'
import styles from '../Admin.module.scss'

interface ImageFieldProps {
  label: string
  currentUrl: string | null
  pending: boolean
  error: unknown
  onUpload: (file: File) => void
}

// One picture per category or brand: shows the current one and replaces it on upload.
export function ImageField({ label, currentUrl, pending, error, onUpload }: ImageFieldProps) {
  const { t } = useTranslation()
  const [file, setFile] = useState<File | null>(null)
  const [inputKey, setInputKey] = useState(0)

  return (
    <div className={styles.form}>
      <strong>{label}</strong>
      {error != null && <Alert tone="error" title={errorMessage(error, t)} />}
      {currentUrl && <img src={currentUrl} alt="" width={96} height={96} style={{ objectFit: 'contain', background: 'var(--color-surface-muted)' }} />}
      <input key={inputKey} type="file" accept="image/*" aria-label={label} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
      <div>
        <Button
          size="sm"
          variant="secondary"
          disabled={!file}
          loading={pending}
          onClick={() => {
            if (!file) return
            onUpload(file)
            setFile(null)
            setInputKey((key) => key + 1)
          }}
        >
          {t('admin.lookups.uploadImage')}
        </Button>
      </div>
    </div>
  )
}
