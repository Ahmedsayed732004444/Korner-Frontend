import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { colorActions, useColors, type Color } from '@/features/adminLookups'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, Input, Skeleton } from '@/shared/ui'
import styles from '../Admin.module.scss'

const hexPattern = /^#[0-9a-fA-F]{6}$/

export function ColorsTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: colors, isLoading, error } = useColors()
  const remove = colorActions.useDelete()
  const [editing, setEditing] = useState<Color | null | undefined>(undefined)

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.lookups.colors')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing(null)}>{t('admin.lookups.addColor')}</Button>}
      </div>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}
      {isLoading && <Skeleton style={{ height: 120 }} />}

      {editing !== undefined && <ColorForm key={editing?.id ?? 'new'} color={editing} onDone={() => setEditing(undefined)} />}

      <ul className={styles.list}>
        {colors?.map((color) => (
          <li key={color.id} className={styles.lookupRow}>
            <span className={styles.thumbCell}>
              <span className={styles.swatch} style={{ background: color.hexCode }} aria-hidden="true" />
              <span>
                <strong>{localize(color.nameAr, color.nameEn)}</strong>
                <small dir="ltr">{color.hexCode}</small>
              </span>
            </span>
            {canWrite && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(color)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove.mutate(color.id)} loading={remove.isPending && remove.variables === color.id}>
                  {t('account.delete')}
                </Button>
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}

function ColorForm({ color, onDone }: { color: Color | null; onDone: () => void }) {
  const { t } = useTranslation()
  const save = colorActions.useSave()
  const [nameAr, setNameAr] = useState(color?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(color?.nameEn ?? '')
  const [hex, setHex] = useState(color?.hexCode ?? '#000000')
  const [sortOrder, setSortOrder] = useState(String(color?.sortOrder ?? 0))
  const [errors, setErrors] = useState<{ nameAr?: string; nameEn?: string; hex?: string }>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const found = {
      nameAr: nameAr.trim() ? undefined : required,
      nameEn: nameEn.trim() ? undefined : required,
      hex: hexPattern.test(hex.trim()) ? undefined : t('admin.lookups.hexInvalid'),
    }
    setErrors(found)
    if (found.nameAr || found.nameEn || found.hex) return
    save.mutate({ id: color?.id ?? null, input: { nameAr: nameAr.trim(), nameEn: nameEn.trim(), hexCode: hex.trim(), sortOrder: Number(sortOrder) || 0 } }, { onSuccess: onDone })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{color ? t('admin.lookups.editColor') : t('admin.lookups.addColor')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <div className={styles.twoCols}>
        <Input label={t('admin.products.nameAr')} value={nameAr} onChange={(event) => { setNameAr(event.target.value); setErrors((c) => ({ ...c, nameAr: undefined })) }} error={errors.nameAr} required />
        <Input label={t('admin.products.nameEn')} dir="ltr" value={nameEn} onChange={(event) => { setNameEn(event.target.value); setErrors((c) => ({ ...c, nameEn: undefined })) }} error={errors.nameEn} required />
        <Input label={t('admin.lookups.hex')} hint="#1E9DF1" dir="ltr" value={hex} onChange={(event) => { setHex(event.target.value); setErrors((c) => ({ ...c, hex: undefined })) }} error={errors.hex} required />
        <Input label={t('admin.lookups.pick')} type="color" value={hexPattern.test(hex) ? hex : '#000000'} onChange={(event) => setHex(event.target.value)} />
        <Input label={t('admin.products.sortOrder')} type="number" optional value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
      </div>
      <div className={styles.actions}>
        <Button type="submit" loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {t('account.cancelEdit')}
        </Button>
      </div>
    </form>
  )
}
