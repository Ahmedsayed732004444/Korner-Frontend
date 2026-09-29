import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminBanners, useDeleteBanner, useSaveBanner, type AdminBanner } from '@/features/adminContent'
import { errorMessage } from '@/shared/api'
import { asUtc, fromDateTimeLocal, toDateTimeLocal } from '@/shared/lib/dates'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Badge, Button, Checkbox, Input, Skeleton } from '@/shared/ui'
import styles from '../Admin.module.scss'

export function BannersTab({ canWrite }: { canWrite: boolean }) {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const { data: banners, isLoading, error } = useAdminBanners()
  const remove = useDeleteBanner()
  const [editing, setEditing] = useState<AdminBanner | null | undefined>(undefined)
  const date = new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-EG' : 'en-EG', { dateStyle: 'medium' })

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.content.banners')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing(null)}>{t('admin.content.addBanner')}</Button>}
      </div>
      <p>{t('admin.content.bannersHint')}</p>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}
      {isLoading && <Skeleton style={{ height: 120 }} />}

      {editing !== undefined && <BannerForm key={editing?.id ?? 'new'} banner={editing} onDone={() => setEditing(undefined)} />}
      {banners?.length === 0 && editing === undefined && <p>{t('admin.content.noBanners')}</p>}

      <ul className={styles.list}>
        {banners?.map((banner) => (
          <li key={banner.id} className={styles.lookupRow}>
            <span className={styles.thumbCell}>
              <img src={i18n.language === 'ar' ? banner.imageUrlAr : banner.imageUrlEn} alt="" width={96} height={48} loading="lazy" style={{ width: 96, height: 48, objectFit: 'cover' }} />
              <span>
                <strong>{localize(banner.titleAr, banner.titleEn) || t('admin.content.untitled')}</strong> {!banner.isActive && <Badge tone="warning">{t('admin.products.inactive')}</Badge>}
                <small>
                  {banner.startsAt || banner.endsAt
                    ? `${banner.startsAt ? date.format(asUtc(banner.startsAt)) : '…'} → ${banner.endsAt ? date.format(asUtc(banner.endsAt)) : '…'}`
                    : t('admin.content.always')}
                </small>
              </span>
            </span>
            {canWrite && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(banner)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove.mutate(banner.id)} loading={remove.isPending && remove.variables === banner.id}>
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

function BannerForm({ banner, onDone }: { banner: AdminBanner | null; onDone: () => void }) {
  const { t } = useTranslation()
  const save = useSaveBanner()
  const [titleAr, setTitleAr] = useState(banner?.titleAr ?? '')
  const [titleEn, setTitleEn] = useState(banner?.titleEn ?? '')
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? '')
  const [sortOrder, setSortOrder] = useState(String(banner?.sortOrder ?? 0))
  const [isActive, setIsActive] = useState(banner?.isActive ?? true)
  const [startsAt, setStartsAt] = useState(toDateTimeLocal(banner?.startsAt ?? null))
  const [endsAt, setEndsAt] = useState(toDateTimeLocal(banner?.endsAt ?? null))
  const [imageAr, setImageAr] = useState<File | null>(null)
  const [imageEn, setImageEn] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ imageAr?: string; imageEn?: string; link?: string; dates?: string }>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const start = fromDateTimeLocal(startsAt)
    const end = fromDateTimeLocal(endsAt)
    const link = linkUrl.trim()
    const found = {
      imageAr: banner || imageAr ? undefined : required,
      imageEn: banner || imageEn ? undefined : required,
      link: !link || link.startsWith('/') && !link.startsWith('//') || /^https?:\/\//i.test(link) ? undefined : t('admin.content.linkInvalid'),
      dates: start && end && end <= start ? t('admin.content.datesInvalid') : undefined,
    }
    setErrors(found)
    if (found.imageAr || found.imageEn || found.link || found.dates) return

    save.mutate(
      { id: banner?.id ?? null, input: { titleAr, titleEn, linkUrl: link, sortOrder: Number(sortOrder) || 0, isActive, startsAt: start, endsAt: end, imageAr, imageEn } },
      { onSuccess: onDone },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{banner ? t('admin.content.editBanner') : t('admin.content.addBanner')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <div className={styles.twoCols}>
        <Input label={t('admin.content.titleAr')} optional value={titleAr} onChange={(event) => setTitleAr(event.target.value)} />
        <Input label={t('admin.content.titleEn')} optional dir="ltr" value={titleEn} onChange={(event) => setTitleEn(event.target.value)} />
        <div className={styles.form}>
          <label>
            <strong>{t('admin.content.imageAr')}</strong>
            <br />
            <input type="file" accept="image/*" onChange={(event) => { setImageAr(event.target.files?.[0] ?? null); setErrors((c) => ({ ...c, imageAr: undefined })) }} />
          </label>
          {banner && !imageAr && <img src={banner.imageUrlAr} alt="" height={60} style={{ maxWidth: '100%', objectFit: 'contain' }} />}
          {errors.imageAr && <small role="alert" style={{ color: 'var(--color-error)' }}>{errors.imageAr}</small>}
        </div>
        <div className={styles.form}>
          <label>
            <strong>{t('admin.content.imageEn')}</strong>
            <br />
            <input type="file" accept="image/*" onChange={(event) => { setImageEn(event.target.files?.[0] ?? null); setErrors((c) => ({ ...c, imageEn: undefined })) }} />
          </label>
          {banner && !imageEn && <img src={banner.imageUrlEn} alt="" height={60} style={{ maxWidth: '100%', objectFit: 'contain' }} />}
          {errors.imageEn && <small role="alert" style={{ color: 'var(--color-error)' }}>{errors.imageEn}</small>}
        </div>
        <Input label={t('admin.content.link')} hint={t('admin.content.linkHint')} optional dir="ltr" value={linkUrl} onChange={(event) => { setLinkUrl(event.target.value); setErrors((c) => ({ ...c, link: undefined })) }} error={errors.link} />
        <Input label={t('admin.products.sortOrder')} type="number" optional value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
        <Input label={t('admin.content.startsAt')} type="datetime-local" optional value={startsAt} onChange={(event) => { setStartsAt(event.target.value); setErrors((c) => ({ ...c, dates: undefined })) }} />
        <Input label={t('admin.content.endsAt')} type="datetime-local" optional value={endsAt} onChange={(event) => { setEndsAt(event.target.value); setErrors((c) => ({ ...c, dates: undefined })) }} error={errors.dates} />
      </div>
      <Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} label={t('admin.lookups.visible')} />
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
