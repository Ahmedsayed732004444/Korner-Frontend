import { useState, type FormEvent } from 'react'
import { ShoppingBag } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { useAddresses } from '@/features/account'
import { cartHeaders, cartKeys, useCart } from '@/features/cart'
import { sizeLabel } from '@/features/catalog'
import {
  checkoutKey,
  lastOrder,
  normalizeDigits,
  useCheckout,
  useStartPayment,
  validateCheckout,
  type CheckoutField,
  type CheckoutOrder,
  type PaymentMethod,
} from '@/features/checkout'
import { chosenGovernorate, useChosenGovernorate, useGovernorates } from '@/features/shipping'
import { useStoreSettings } from '@/features/store'
import { ApiError, errorMessage, useSession } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { formatPiasters } from '@/shared/lib/money'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Button, ButtonLink, Checkbox, ChoiceGroup, EmptyState, Input, Radio, Select, Skeleton } from '@/shared/ui'
import styles from './CheckoutPage.module.scss'

// Server field names ("CustomerPhone", "Address.Street") mapped to the form's fields.
const serverFields: Record<string, CheckoutField> = {
  CustomerName: 'name',
  CustomerPhone: 'phone',
  CustomerEmail: 'email',
  GovernorateId: 'governorate',
  'Address.Area': 'area',
  'Address.Street': 'street',
  'Address.Building': 'building',
  AcceptTerms: 'acceptTerms',
}

export function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const localize = useLocalize()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const current = useSession()
  useDocumentTitle(t('checkout.pageTitle'))

  const { data: settings } = useStoreSettings()
  const { data: governorates } = useGovernorates()
  const chosen = useChosenGovernorate()
  const { data: saved } = useAddresses()
  // A signed-in customer's default saved address fills the form; anything they type replaces it, and nothing needs an effect.
  const defaults = saved?.find((item) => item.isDefault) ?? saved?.[0]
  const [pickedGovernorate, setGovernorateId] = useState<number | null>(null)
  const governorateId = pickedGovernorate ?? chosen ?? defaults?.governorateId ?? null
  const activeGovernorate = governorates?.some((item) => item.id === governorateId) ? governorateId : null
  const { data: cart, isLoading } = useCart(activeGovernorate)

  const [nameInput, setName] = useState<string | null>(null)
  const [phoneInput, setPhone] = useState<string | null>(null)
  const [emailInput, setEmail] = useState<string | null>(null)
  const [areaInput, setArea] = useState<string | null>(null)
  const [streetInput, setStreet] = useState<string | null>(null)
  const [buildingInput, setBuilding] = useState<string | null>(null)
  const [floorInput, setFloor] = useState<string | null>(null)
  const [apartmentInput, setApartment] = useState<string | null>(null)
  const [landmarkInput, setLandmark] = useState<string | null>(null)
  const name = nameInput ?? defaults?.recipientName ?? (current ? `${current.user.firstName} ${current.user.lastName}`.trim() : '')
  const phone = phoneInput ?? defaults?.phone ?? ''
  const email = emailInput ?? current?.user.email ?? ''
  const area = areaInput ?? defaults?.address.area ?? ''
  const street = streetInput ?? defaults?.address.street ?? ''
  const building = buildingInput ?? defaults?.address.building ?? ''
  const floor = floorInput ?? defaults?.address.floor ?? ''
  const apartment = apartmentInput ?? defaults?.address.apartment ?? ''
  const landmark = landmarkInput ?? defaults?.address.landmark ?? ''
  const [method, setMethod] = useState<PaymentMethod>('Card')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<CheckoutField, string>>>({})
  const [order, setOrder] = useState<CheckoutOrder | null>(null)

  const checkout = useCheckout()
  const startPayment = useStartPayment()
  const submitting = checkout.isPending || startPayment.isPending
  const failure = checkout.error ?? startPayment.error
  const methods = settings?.paymentMethods ?? ['Card']
  const maintenance = settings?.isMaintenanceMode ?? false

  const edit = (field: CheckoutField, set: (value: string) => void) => (event: { target: { value: string } }) => {
    set(event.target.value)
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current))
  }

  const errorText = (field: CheckoutField) => {
    const code = errors[field]
    return code ? t(`checkout.errors.${code}`) : undefined
  }

  // The order already exists after the first step, so a failed payment start is retried without creating it again.
  const pay = async (created: CheckoutOrder, customerPhone: string) => {
    const session = await startPayment.mutateAsync({ orderNumber: created.orderNumber, method, phone: customerPhone })
    checkoutKey.clear()
    window.location.assign(session.checkoutUrl)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const customerPhone = normalizeDigits(phone).trim()
    const found = validateCheckout({ name, phone, email, governorateId: activeGovernorate, area, street, building, acceptTerms })
    setErrors(found)
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }

    try {
      let created = order
      if (!created) {
        created = await checkout.mutateAsync({
          headers: cartHeaders(),
          input: {
            checkoutKey: checkoutKey.get(),
            customerName: name.trim(),
            customerPhone,
            customerEmail: email.trim(),
            governorateId: activeGovernorate!,
            address: { area: area.trim(), street: street.trim(), building: building.trim(), floor: floor.trim() || null, apartment: apartment.trim() || null, landmark: landmark.trim() || null },
            paymentMethod: method,
            language: i18n.language === 'ar' ? 'Arabic' : 'English',
            acceptTerms,
            marketingConsent,
          },
        })
        setOrder(created)
        lastOrder.set({ number: created.orderNumber, phone: customerPhone })
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      }
      await pay(created, customerPhone)
    } catch (error) {
      if (error instanceof ApiError) {
        const fromServer: Partial<Record<CheckoutField, string>> = {}
        for (const key of Object.keys(error.fieldErrors)) {
          const field = serverFields[key]
          if (field) fromServer[field] = field === 'phone' ? 'phone' : field === 'email' ? 'email' : 'required'
        }
        if (Object.keys(fromServer).length > 0) setErrors(fromServer)
        // The cart changed under the shopper: the cart page shows exactly what and lets them fix it.
        if (error.code?.startsWith('Checkout.') && error.code !== 'Checkout.StoreInMaintenance') navigate('/cart')
      }
    }
  }

  if (isLoading) {
    return (
      <div className={`container ${styles.page}`} aria-busy="true">
        <Skeleton style={{ height: 32, width: 220 }} />
        <Skeleton style={{ height: 320 }} />
      </div>
    )
  }

  if (!order && (!cart || cart.items.length === 0)) {
    return (
      <div className="container">
        <EmptyState icon={ShoppingBag} title={t('cart.emptyTitle')} text={t('cart.emptyText')} action={<ButtonLink to="/shop">{t('cart.browse')}</ButtonLink>} />
      </div>
    )
  }

  const shipping = cart?.shipping
  const total = order ? order.totalPiasters : (cart?.totalPiasters ?? cart?.subtotalPiasters ?? 0)

  return (
    <div className={`container ${styles.page}`}>
      <h1 className={styles.title}>{t('checkout.title')}</h1>

      <form className={styles.layout} onSubmit={(event) => void onSubmit(event)} noValidate>
        <div className={styles.fields}>
          {maintenance && <Alert tone="warning" title={localize(settings?.maintenanceMessageAr, settings?.maintenanceMessageEn) || t('checkout.maintenance')} />}
          {order && <Alert tone="info" title={t('checkout.orderCreated', { number: order.orderNumber })} />}
          {failure && <Alert tone="error" title={errorMessage(failure, t)} />}

          <fieldset className={styles.group} disabled={submitting || order !== null}>
            <legend>{t('checkout.contact')}</legend>
            <Input label={t('checkout.name')} value={name} onChange={edit('name', setName)} error={errorText('name')} autoComplete="name" required />
            <Input
              label={t('checkout.phone')}
              hint={t('checkout.phoneHint')}
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={edit('phone', setPhone)}
              error={errorText('phone')}
              autoComplete="tel"
              required
            />
            <Input label={t('checkout.email')} hint={t('checkout.emailHint')} type="email" value={email} onChange={edit('email', setEmail)} error={errorText('email')} autoComplete="email" required />
          </fieldset>

          <fieldset className={styles.group} disabled={submitting || order !== null}>
            <legend>{t('checkout.address')}</legend>
            <Select
              label={t('checkout.governorate')}
              placeholder={t('checkout.chooseGovernorate')}
              value={activeGovernorate ? String(activeGovernorate) : ''}
              onChange={(event) => {
                const id = event.target.value ? Number(event.target.value) : null
                setGovernorateId(id)
                setErrors((current) => ({ ...current, governorate: undefined }))
                chosenGovernorate.set(id)
              }}
              options={(governorates ?? []).map((item) => ({ value: String(item.id), label: localize(item.nameAr, item.nameEn) }))}
              error={errorText('governorate')}
              autoComplete="address-level1"
              required
            />
            <Input label={t('checkout.area')} value={area} onChange={edit('area', setArea)} error={errorText('area')} autoComplete="address-level2" required />
            <Input label={t('checkout.street')} value={street} onChange={edit('street', setStreet)} error={errorText('street')} autoComplete="address-line1" required />
            <div className={styles.row}>
              <Input label={t('checkout.building')} value={building} onChange={edit('building', setBuilding)} error={errorText('building')} required />
              <Input label={t('checkout.floor')} value={floor} onChange={(event) => setFloor(event.target.value)} optional />
              <Input label={t('checkout.apartment')} value={apartment} onChange={(event) => setApartment(event.target.value)} optional />
            </div>
            <Input label={t('checkout.landmark')} value={landmark} onChange={(event) => setLandmark(event.target.value)} optional />
          </fieldset>

          {methods.length > 1 && (
            <ChoiceGroup legend={t('checkout.payment')}>
              {methods.map((item) => (
                <Radio key={item} name="method" label={t(`checkout.method.${item}`)} checked={method === item} onChange={() => setMethod(item)} disabled={order !== null} />
              ))}
            </ChoiceGroup>
          )}

          <div className={styles.consents}>
            <Checkbox
              checked={acceptTerms}
              onChange={(event) => {
                setAcceptTerms(event.target.checked)
                setErrors((current) => ({ ...current, acceptTerms: undefined }))
              }}
              invalid={Boolean(errors.acceptTerms)}
              label={
                <>
                  {t('checkout.acceptTerms')} <Link to="/pages/terms" target="_blank">{t('footer.terms')}</Link>
                </>
              }
              hint={errorText('acceptTerms')}
            />
            <Checkbox checked={marketingConsent} onChange={(event) => setMarketingConsent(event.target.checked)} label={t('checkout.marketing')} />
          </div>
        </div>

        <aside className={styles.summary} aria-label={t('cart.summary')}>
          <h2>{t('cart.summary')}</h2>
          {!order && (
            <ul className={styles.items}>
              {cart?.items.map((item) => (
                <li key={item.variantId}>
                  {item.imageUrl && <img src={item.imageUrl} alt="" width={48} height={60} loading="lazy" />}
                  <span>
                    {localize(item.productNameAr, item.productNameEn)}
                    <small>
                      {[localize(item.colorNameAr, item.colorNameEn), sizeLabel(item.size, t)].filter(Boolean).join(' · ')} × {item.quantity}
                    </small>
                  </span>
                  <span>{formatPiasters(item.lineTotalPiasters, i18n.language)}</span>
                </li>
              ))}
            </ul>
          )}
          <dl className={styles.totals}>
            <div>
              <dt>{t('cart.subtotal')}</dt>
              <dd>{formatPiasters(order ? order.subtotalPiasters : (cart?.subtotalPiasters ?? 0), i18n.language)}</dd>
            </div>
            <div>
              <dt>{t('cart.shipping')}</dt>
              <dd>
                {order
                  ? order.shippingFeePiasters === 0 ? <span className="text-positive">{t('cart.free')}</span> : formatPiasters(order.shippingFeePiasters, i18n.language)
                  : shipping ? (shipping.isFreeShipping ? <span className="text-positive">{t('cart.free')}</span> : formatPiasters(shipping.shippingFeePiasters, i18n.language)) : t('cart.chooseToSee')}
              </dd>
            </div>
            <div className={styles.total}>
              <dt>{t('cart.total')}</dt>
              <dd>{formatPiasters(total, i18n.language)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" fullWidth loading={submitting} disabled={maintenance}>
            {t('checkout.pay', { amount: formatPiasters(total, i18n.language) })}
          </Button>
          <p className={styles.secure}>{t('product.securePayment')}</p>
        </aside>
      </form>
    </div>
  )
}
