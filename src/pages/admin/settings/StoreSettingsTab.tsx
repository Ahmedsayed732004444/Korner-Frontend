import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useAdminSettings, useSaveSettings, type StoreSettingsAdmin } from '@/features/adminSettings'
import { errorMessage } from '@/shared/api'
import { parsePounds, piastersToPounds } from '@/shared/lib/money'
import { Alert, Button, Checkbox, Input, Skeleton } from '@/shared/ui'
import styles from '../Admin.module.scss'

const phonePattern = /^\+?\d{6,20}$/

export function StoreSettingsTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useAdminSettings()

  return (
    <section className={styles.panel}>
      <h2>{t('admin.settings.store')}</h2>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {isLoading && <Skeleton style={{ height: 240 }} />}
      {data && <SettingsForm settings={data} canWrite={canWrite} />}
    </section>
  )
}

type Field = 'freeShipping' | 'highValue' | 'lowStock' | 'messageAr' | 'messageEn' | 'whatsApp' | 'phone' | 'email'

function SettingsForm({ settings, canWrite }: { settings: StoreSettingsAdmin; canWrite: boolean }) {
  const { t } = useTranslation()
  const save = useSaveSettings()
  const [freeShipping, setFreeShipping] = useState(settings.freeShippingThresholdPiasters ? piastersToPounds(settings.freeShippingThresholdPiasters) : '')
  const [highValue, setHighValue] = useState(piastersToPounds(settings.highValueReviewThresholdPiasters))
  const [lowStock, setLowStock] = useState(String(settings.lowStockThreshold))
  const [maintenance, setMaintenance] = useState(settings.isMaintenanceMode)
  const [messageAr, setMessageAr] = useState(settings.maintenanceMessageAr ?? '')
  const [messageEn, setMessageEn] = useState(settings.maintenanceMessageEn ?? '')
  const [whatsApp, setWhatsApp] = useState(settings.supportWhatsApp ?? '')
  const [phone, setPhone] = useState(settings.supportPhone ?? '')
  const [email, setEmail] = useState(settings.supportEmail ?? '')
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})

  const clear = (field: Field) => setErrors((current) => ({ ...current, [field]: undefined }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const amount = t('admin.products.invalidAmount')
    const phoneText = t('admin.settings.phoneInvalid')
    const free = freeShipping.trim() ? parsePounds(freeShipping) : null
    const high = parsePounds(highValue)
    const found: Partial<Record<Field, string>> = {}
    if (freeShipping.trim() && (free === null || free <= 0)) found.freeShipping = amount
    if (high === null || high <= 0) found.highValue = amount
    if (!Number.isInteger(Number(lowStock)) || Number(lowStock) < 0) found.lowStock = required
    if (maintenance && !messageAr.trim()) found.messageAr = required
    if (maintenance && !messageEn.trim()) found.messageEn = required
    if (whatsApp.trim() && !phonePattern.test(whatsApp.trim())) found.whatsApp = phoneText
    if (phone.trim() && !phonePattern.test(phone.trim())) found.phone = phoneText
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) found.email = t('auth.errors.email')
    setErrors(found)
    if (Object.keys(found).length > 0 || high === null) return

    save.mutate({
      freeShippingThresholdPiasters: free,
      highValueReviewThresholdPiasters: high,
      lowStockThreshold: Number(lowStock),
      isMaintenanceMode: maintenance,
      maintenanceMessageAr: messageAr.trim() || null,
      maintenanceMessageEn: messageEn.trim() || null,
      supportWhatsApp: whatsApp.trim() || null,
      supportPhone: phone.trim() || null,
      supportEmail: email.trim() || null,
    })
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      {save.isSuccess && <Alert tone="success" title={t('account.saved')} />}
      <fieldset disabled={!canWrite} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className={styles.form}>
        <div className={styles.twoCols}>
          <Input label={t('admin.settings.freeShipping')} hint={t('admin.settings.freeShippingHint')} inputMode="decimal" optional value={freeShipping} onChange={(event) => { setFreeShipping(event.target.value); clear('freeShipping') }} error={errors.freeShipping} />
          <Input label={t('admin.settings.highValue')} hint={t('admin.settings.highValueHint')} inputMode="decimal" value={highValue} onChange={(event) => { setHighValue(event.target.value); clear('highValue') }} error={errors.highValue} required />
          <Input label={t('admin.settings.lowStock')} hint={t('admin.settings.lowStockHint')} type="number" min={0} value={lowStock} onChange={(event) => { setLowStock(event.target.value); clear('lowStock') }} error={errors.lowStock} required />
        </div>

        <h3>{t('admin.settings.contact')}</h3>
        <div className={styles.twoCols}>
          <Input label="WhatsApp" hint="+201012345678" dir="ltr" optional value={whatsApp} onChange={(event) => { setWhatsApp(event.target.value); clear('whatsApp') }} error={errors.whatsApp} />
          <Input label={t('admin.settings.supportPhone')} dir="ltr" optional value={phone} onChange={(event) => { setPhone(event.target.value); clear('phone') }} error={errors.phone} />
          <Input label={t('admin.settings.supportEmail')} type="email" dir="ltr" optional value={email} onChange={(event) => { setEmail(event.target.value); clear('email') }} error={errors.email} />
        </div>

        <h3>{t('admin.settings.maintenance')}</h3>
        <Checkbox checked={maintenance} onChange={(event) => setMaintenance(event.target.checked)} label={t('admin.settings.maintenanceOn')} hint={t('admin.settings.maintenanceHint')} />
        {maintenance && (
          <div className={styles.twoCols}>
            <Input label={t('admin.settings.messageAr')} value={messageAr} onChange={(event) => { setMessageAr(event.target.value); clear('messageAr') }} error={errors.messageAr} required />
            <Input label={t('admin.settings.messageEn')} dir="ltr" value={messageEn} onChange={(event) => { setMessageEn(event.target.value); clear('messageEn') }} error={errors.messageEn} required />
          </div>
        )}

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
