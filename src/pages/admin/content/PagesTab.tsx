import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { pageTypes, useAdminPages, useSavePage, type AdminPage, type PageType } from '@/features/adminContent'
import { errorMessage } from '@/shared/api'
import { Alert, Button, Input, Select, Skeleton, Textarea } from '@/shared/ui'
import styles from '../Admin.module.scss'

export function PagesTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const { data: pages, isLoading, error } = useAdminPages()
  const [type, setType] = useState<PageType>('Terms')
  const current = pages?.find((page) => page.type === type) ?? null

  return (
    <section className={styles.panel}>
      <h2>{t('admin.content.pages')}</h2>
      <p>{t('admin.content.pagesHint')}</p>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 160 }} />}
      <Select
        label={t('admin.content.page')}
        value={type}
        onChange={(event) => setType(event.target.value as PageType)}
        options={pageTypes.map((item) => ({ value: item, label: `${t(`admin.content.pageTypes.${item}`)}${pages?.some((page) => page.type === item) ? '' : ` (${t('admin.content.notWritten')})`}` }))}
      />
      {pages && <PageForm key={type} type={type} page={current} canWrite={canWrite} />}
    </section>
  )
}

function PageForm({ type, page, canWrite }: { type: PageType; page: AdminPage | null; canWrite: boolean }) {
  const { t } = useTranslation()
  const save = useSavePage()
  const [titleAr, setTitleAr] = useState(page?.titleAr ?? '')
  const [titleEn, setTitleEn] = useState(page?.titleEn ?? '')
  const [bodyAr, setBodyAr] = useState(page?.bodyAr ?? '')
  const [bodyEn, setBodyEn] = useState(page?.bodyEn ?? '')
  const [errors, setErrors] = useState<Partial<Record<'titleAr' | 'titleEn' | 'bodyAr' | 'bodyEn', string>>>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const found = {
      titleAr: titleAr.trim() ? undefined : required,
      titleEn: titleEn.trim() ? undefined : required,
      bodyAr: bodyAr.trim() ? undefined : required,
      bodyEn: bodyEn.trim() ? undefined : required,
    }
    setErrors(found)
    if (Object.values(found).some(Boolean)) return
    save.mutate({ type, input: { titleAr: titleAr.trim(), titleEn: titleEn.trim(), bodyAr: bodyAr.trim(), bodyEn: bodyEn.trim() } })
  }

  const clear = (field: keyof typeof errors) => setErrors((current) => ({ ...current, [field]: undefined }))

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      {save.isSuccess && <Alert tone="success" title={t('account.saved')} />}
      <fieldset disabled={!canWrite} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className={styles.form}>
        <div className={styles.twoCols}>
          <Input label={t('admin.content.titleAr')} value={titleAr} onChange={(event) => { setTitleAr(event.target.value); clear('titleAr') }} error={errors.titleAr} required />
          <Input label={t('admin.content.titleEn')} dir="ltr" value={titleEn} onChange={(event) => { setTitleEn(event.target.value); clear('titleEn') }} error={errors.titleEn} required />
          <Textarea label={t('admin.content.bodyAr')} rows={14} value={bodyAr} onChange={(event) => { setBodyAr(event.target.value); clear('bodyAr') }} error={errors.bodyAr} required />
          <Textarea label={t('admin.content.bodyEn')} rows={14} dir="ltr" value={bodyEn} onChange={(event) => { setBodyEn(event.target.value); clear('bodyEn') }} error={errors.bodyEn} required />
        </div>
        {canWrite && (
          <div>
            <Button type="submit" loading={save.isPending}>
              {t('account.save')}
            </Button>
          </div>
        )}
      </fieldset>
    </form>
  )
}
