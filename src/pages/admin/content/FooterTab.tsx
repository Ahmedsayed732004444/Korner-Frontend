import { useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { socialPlatforms, useAdminFooter, useSaveFooter, type EditableColumn, type EditableLink, type FooterInput, type SocialPlatform } from '@/features/adminContent'
import { ApiError, errorMessage } from '@/shared/api'
import { Alert, Button, Checkbox, Input, Skeleton, Textarea } from '@/shared/ui'
import styles from '../Admin.module.scss'

const maxColumns = 4
const maxLinksPerColumn = 10
const maxBottomLinks = 6

const emptyLink: EditableLink = { labelAr: '', labelEn: '', url: '' }

function move<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const copy = [...items]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

export function FooterTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAdminFooter()

  return (
    <section className={styles.panel}>
      <h2>{t('admin.footer.title')}</h2>
      <p>{t('admin.footer.hint')}</p>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 240 }} />}
      {data && <FooterForm key={data.updatedAt ?? 'default'} initial={data} canWrite={canWrite} />}
    </section>
  )
}

function FooterForm({ initial, canWrite }: { initial: FooterInput; canWrite: boolean }) {
  const { t } = useTranslation()
  const save = useSaveFooter()
  const [form, setForm] = useState<FooterInput>(initial)
  const socialUrl = (platform: SocialPlatform) => form.socialLinks.find((s) => s.platform === platform)?.url ?? ''

  const set = (patch: Partial<FooterInput>) => setForm((current) => ({ ...current, ...patch }))
  const setColumn = (index: number, column: EditableColumn) => set({ columns: form.columns.map((c, i) => (i === index ? column : c)) })
  const setSocial = (platform: SocialPlatform, url: string) =>
    set({
      socialLinks: socialPlatforms
        .map((p) => ({ platform: p, url: p === platform ? url : socialUrl(p) }))
        .filter((s) => s.url.trim() !== ''),
    })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    save.mutate(form)
  }

  // The API names the exact field ("Columns[1].Links[0].Url"); the messages are shown together above the save button.
  const fieldErrors = save.error instanceof ApiError ? Object.values(save.error.fieldErrors).flat() : []

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <fieldset disabled={!canWrite} className={styles.form} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <h3>{t('admin.footer.about')}</h3>
        <div className={styles.twoCols}>
          <Textarea label={t('admin.footer.taglineAr')} hint={t('admin.footer.taglineHint')} optional value={form.taglineAr ?? ''} onChange={(e) => set({ taglineAr: e.target.value })} />
          <Textarea label={t('admin.footer.taglineEn')} optional dir="ltr" value={form.taglineEn ?? ''} onChange={(e) => set({ taglineEn: e.target.value })} />
        </div>

        <h3>{t('admin.footer.automatic')}</h3>
        <Checkbox checked={form.showCategories} onChange={(e) => set({ showCategories: e.target.checked })} label={t('admin.footer.showCategories')} hint={t('admin.footer.showCategoriesHint')} />
        <Checkbox checked={form.showContact} onChange={(e) => set({ showContact: e.target.checked })} label={t('admin.footer.showContact')} hint={t('admin.footer.showContactHint')} />

        <div className={styles.headRow}>
          <h3>{t('admin.footer.columns')}</h3>
          <Button size="sm" variant="secondary" startIcon={<Plus size={14} aria-hidden="true" />} disabled={form.columns.length >= maxColumns} onClick={() => set({ columns: [...form.columns, { titleAr: '', titleEn: '', links: [{ ...emptyLink }] }] })}>
            {t('admin.footer.addColumn')}
          </Button>
        </div>
        {form.columns.map((column, index) => (
          <div key={index} className={styles.panel}>
            <div className={styles.headRow}>
              <strong>{t('admin.footer.column', { number: index + 1 })}</strong>
              <span className={styles.actions}>
                <Button size="sm" variant="ghost" onClick={() => set({ columns: move(form.columns, index, -1) })} disabled={index === 0} aria-label={t('admin.products.moveUp')}>
                  <ArrowUp size={16} aria-hidden="true" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => set({ columns: move(form.columns, index, 1) })} disabled={index === form.columns.length - 1} aria-label={t('admin.products.moveDown')}>
                  <ArrowDown size={16} aria-hidden="true" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => set({ columns: form.columns.filter((_, i) => i !== index) })} aria-label={t('admin.footer.removeColumn')}>
                  <Trash2 size={16} aria-hidden="true" />
                </Button>
              </span>
            </div>
            <div className={styles.twoCols}>
              <Input label={t('admin.footer.columnTitleAr')} value={column.titleAr} onChange={(e) => setColumn(index, { ...column, titleAr: e.target.value })} required />
              <Input label={t('admin.footer.columnTitleEn')} dir="ltr" value={column.titleEn} onChange={(e) => setColumn(index, { ...column, titleEn: e.target.value })} required />
            </div>
            <LinksEditor links={column.links} max={maxLinksPerColumn} onChange={(links) => setColumn(index, { ...column, links })} />
          </div>
        ))}

        <h3>{t('admin.footer.social')}</h3>
        <div className={styles.twoCols}>
          {socialPlatforms.map((platform) => (
            <Input key={platform} label={platform} hint={t('admin.footer.socialHint')} type="url" dir="ltr" optional value={socialUrl(platform)} onChange={(e) => setSocial(platform, e.target.value)} />
          ))}
        </div>

        <h3>{t('admin.footer.bottom')}</h3>
        <LinksEditor links={form.bottomLinks} max={maxBottomLinks} onChange={(bottomLinks) => set({ bottomLinks })} />
        <div className={styles.twoCols}>
          <Input label={t('admin.footer.copyrightAr')} hint={t('admin.footer.copyrightHint')} optional value={form.copyrightAr ?? ''} onChange={(e) => set({ copyrightAr: e.target.value })} />
          <Input label={t('admin.footer.copyrightEn')} optional dir="ltr" value={form.copyrightEn ?? ''} onChange={(e) => set({ copyrightEn: e.target.value })} />
        </div>
        <p>{t('admin.footer.creditNote')}</p>
      </fieldset>

      {save.isSuccess && <Alert tone="success" title={t('account.saved')} />}
      {save.error != null && (
        <Alert tone="error" title={errorMessage(save.error, t)}>
          {fieldErrors.length > 0 ? fieldErrors.join(' · ') : undefined}
        </Alert>
      )}
      {canWrite && (
        <div>
          <Button type="submit" loading={save.isPending}>
            {t('account.save')}
          </Button>
        </div>
      )}
    </form>
  )
}

function LinksEditor({ links, max, onChange }: { links: EditableLink[]; max: number; onChange: (links: EditableLink[]) => void }) {
  const { t } = useTranslation()
  const update = (index: number, patch: Partial<EditableLink>) => onChange(links.map((link, i) => (i === index ? { ...link, ...patch } : link)))

  return (
    <div className={styles.form}>
      {links.map((link, index) => (
        <div key={index} className={styles.linkRow}>
          <Input label={t('admin.footer.labelAr')} value={link.labelAr} onChange={(e) => update(index, { labelAr: e.target.value })} required />
          <Input label={t('admin.footer.labelEn')} dir="ltr" value={link.labelEn} onChange={(e) => update(index, { labelEn: e.target.value })} required />
          <Input label={t('admin.footer.url')} hint={t('admin.footer.urlHint')} dir="ltr" value={link.url} onChange={(e) => update(index, { url: e.target.value })} required />
          <span className={styles.actions}>
            <Button size="sm" variant="ghost" onClick={() => onChange(move(links, index, -1))} disabled={index === 0} aria-label={t('admin.products.moveUp')}>
              <ArrowUp size={16} aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(move(links, index, 1))} disabled={index === links.length - 1} aria-label={t('admin.products.moveDown')}>
              <ArrowDown size={16} aria-hidden="true" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onChange(links.filter((_, i) => i !== index))} aria-label={t('admin.footer.removeLink')}>
              <Trash2 size={16} aria-hidden="true" />
            </Button>
          </span>
        </div>
      ))}
      <div>
        <Button size="sm" variant="secondary" startIcon={<Plus size={14} aria-hidden="true" />} disabled={links.length >= max} onClick={() => onChange([...links, { ...emptyLink }])}>
          {t('admin.footer.addLink')}
        </Button>
      </div>
    </div>
  )
}
