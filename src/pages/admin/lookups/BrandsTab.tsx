import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { brandActions, useBrands, type Brand } from '@/features/adminLookups'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Badge, Button, Checkbox, Input, Skeleton } from '@/shared/ui'
import { ImageField } from './ImageField'
import styles from '../Admin.module.scss'

export function BrandsTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: brands, isLoading, error } = useBrands()
  const remove = brandActions.useDelete()
  const [editing, setEditing] = useState<Brand | null | undefined>(undefined)

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.lookups.brands')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing(null)}>{t('admin.lookups.addBrand')}</Button>}
      </div>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}
      {isLoading && <Skeleton style={{ height: 120 }} />}

      {editing !== undefined && <BrandForm key={editing?.id ?? 'new'} brand={editing} onDone={() => setEditing(undefined)} />}
      {brands?.length === 0 && editing === undefined && <p>{t('admin.lookups.noBrands')}</p>}

      <ul className={styles.list}>
        {brands?.map((brand) => (
          <li key={brand.id} className={styles.lookupRow}>
            <span>
              <strong>{localize(brand.nameAr, brand.nameEn)}</strong> {!brand.isActive && <Badge tone="warning">{t('admin.products.inactive')}</Badge>}
              <small dir="ltr">{brand.slug}</small>
            </span>
            {canWrite && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(brand)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove.mutate(brand.id)} loading={remove.isPending && remove.variables === brand.id}>
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

function BrandForm({ brand, onDone }: { brand: Brand | null; onDone: () => void }) {
  const { t } = useTranslation()
  const save = brandActions.useSave()
  const logo = brandActions.useLogo()
  const [saved, setSaved] = useState<Brand | null>(brand)
  const [nameAr, setNameAr] = useState(brand?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(brand?.nameEn ?? '')
  const [slug, setSlug] = useState(brand?.slug ?? '')
  const [isActive, setIsActive] = useState(brand?.isActive ?? true)
  const [errors, setErrors] = useState<{ nameAr?: string; nameEn?: string }>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const found = { nameAr: nameAr.trim() ? undefined : required, nameEn: nameEn.trim() ? undefined : required }
    setErrors(found)
    if (found.nameAr || found.nameEn) return
    save.mutate(
      { id: saved?.id ?? null, input: { nameAr: nameAr.trim(), nameEn: nameEn.trim(), slug: slug.trim() || null, isActive } },
      { onSuccess: (result) => (saved ? onDone() : setSaved(result)) },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{brand ? t('admin.lookups.editBrand') : t('admin.lookups.addBrand')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <div className={styles.twoCols}>
        <Input label={t('admin.products.nameAr')} value={nameAr} onChange={(event) => { setNameAr(event.target.value); setErrors((c) => ({ ...c, nameAr: undefined })) }} error={errors.nameAr} required />
        <Input label={t('admin.products.nameEn')} dir="ltr" value={nameEn} onChange={(event) => { setNameEn(event.target.value); setErrors((c) => ({ ...c, nameEn: undefined })) }} error={errors.nameEn} required />
        <Input label={t('admin.lookups.slug')} hint={t('admin.products.slugHint')} optional dir="ltr" value={slug} onChange={(event) => setSlug(event.target.value)} />
      </div>
      <Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} label={t('admin.lookups.visible')} />
      {saved && !brand && <Alert tone="success" title={t('account.saved')} />}
      {saved && <ImageField label={t('admin.lookups.logo')} currentUrl={saved.logoUrl} pending={logo.isPending} error={logo.error} onUpload={(file) => logo.mutate({ id: saved.id, file }, { onSuccess: () => onDone() })} />}
      <div className={styles.actions}>
        <Button type="submit" loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {saved && !brand ? t('common.close') : t('account.cancelEdit')}
        </Button>
      </div>
    </form>
  )
}
