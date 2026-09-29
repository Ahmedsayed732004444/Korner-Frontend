import { useState, type ReactNode } from 'react'
import { ArrowRight, Languages, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  Badge,
  Breadcrumb,
  Button,
  Checkbox,
  ChoiceGroup,
  EmptyState,
  Input,
  Logo,
  Price,
  QuantityInput,
  Radio,
  Select,
  SectionTitle,
  SizePicker,
  Skeleton,
  Spinner,
  SwatchPicker,
} from '@/shared/ui'
import styles from './StyleGuidePage.module.scss'

const colorTokens = [
  'primary', 'accent', 'bg-muted', 'surface-muted', 'text', 'text-muted', 'text-subtle', 'border', 'border-strong',
  'success', 'warning', 'error', 'info', 'focus',
]

const typeScale = [
  ['5xl', 'extrabold'],
  ['4xl', 'bold'],
  ['2xl', 'bold'],
  ['xl', 'bold'],
  ['lg', 'semibold'],
  ['md', 'regular'],
  ['sm', 'regular'],
  ['xs', 'semibold'],
] as const

// Development-only page (docs/DESIGN.md §8): every shared component in every state, in both languages.
export function StyleGuidePage() {
  const { t, i18n } = useTranslation()
  const s = (key: string) => t(`styleguide.sample.${key}`)
  const [color, setColor] = useState('black')
  const [size, setSize] = useState('M')
  const [quantity, setQuantity] = useState(1)

  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.header}>
        <div>
          <Logo />
          <h1 style={{ fontSize: 'var(--text-3xl)', marginTop: 'var(--space-4)' }}>{t('styleguide.title')}</h1>
          <p className={styles.intro}>{t('styleguide.intro')}</p>
        </div>
        <Button variant="secondary" startIcon={<Languages size={18} aria-hidden="true" />} onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}>
          {t('common.switchLanguage')}
        </Button>
      </header>

      <Section title={t('styleguide.colors')}>
        <div className={styles.swatches}>
          {colorTokens.map((token) => (
            <div key={token} className={styles.swatch}>
              <span className={styles.swatchColor} style={{ background: `var(--color-${token})` }} />
              <span className={styles.swatchName}>--color-{token}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t('styleguide.typography')}>
        <div className={styles.type}>
          {typeScale.map(([sizeName, weight]) => (
            <div key={sizeName} className={styles.typeSample}>
              <span className={styles.typeMeta}>
                {sizeName} / {weight}
              </span>
              <span style={{ fontSize: `var(--text-${sizeName})`, fontWeight: `var(--weight-${weight})`, color: 'var(--color-text)' }}>
                {t('brand.tagline')}
              </span>
            </div>
          ))}
          <p>{s('successText')} {s('infoText')}</p>
        </div>
      </Section>

      <Section title={t('styleguide.buttons')}>
        {(['primary', 'secondary', 'ghost', 'link'] as const).map((variant) => (
          <div key={variant}>
            <span className={styles.stateLabel}>{variant}</span>
            <div className={styles.row}>
              <Button variant={variant} startIcon={variant !== 'link' ? <ShoppingBag size={18} aria-hidden="true" /> : undefined}>
                {s('addToCart')}
              </Button>
              <Button variant={variant} disabled>
                {t('styleguide.states.disabled')}
              </Button>
              {variant !== 'link' && (
                <Button variant={variant} loading>
                  {s('checkout')}
                </Button>
              )}
            </div>
          </div>
        ))}
        <div>
          <span className={styles.stateLabel}>sm / lg / full width / icon only</span>
          <div className={styles.row}>
            <Button size="sm">{s('viewDetails')}</Button>
            <Button size="lg" endIcon={<ArrowRight size={18} aria-hidden="true" className="flip-rtl" />}>
              {s('continueShopping')}
            </Button>
            <Button iconOnly variant="secondary" aria-label={s('addToCart')}>
              <ShoppingBag size={20} aria-hidden="true" />
            </Button>
          </div>
          <div style={{ maxWidth: 360, marginTop: 'var(--space-4)' }}>
            <Button fullWidth size="lg">
              {s('checkout')}
            </Button>
          </div>
        </div>
      </Section>

      <Section title={t('styleguide.forms')}>
        <div className={styles.grid}>
          <Input label={s('name')} placeholder={s('namePlaceholder')} required autoComplete="name" />
          <Input label={s('phone')} hint={s('phoneHint')} type="tel" inputMode="tel" autoComplete="tel" defaultValue="0101234" error={s('phoneError')} required />
          <Input label={s('email')} type="email" defaultValue="mona@example.com" success={s('emailSaved')} />
          <Select
            label={s('governorate')}
            placeholder={s('chooseGovernorate')}
            defaultValue=""
            required
            options={[
              { value: '1', label: s('cairo') },
              { value: '2', label: s('alexandria') },
              { value: '3', label: s('giza'), disabled: true },
            ]}
          />
          <Input label={s('email')} optional disabled placeholder="—" />
          <div>
            <ChoiceGroup legend={t('styleguide.states.default')}>
              <Checkbox label={s('acceptTerms')} invalid />
              <Checkbox label={s('marketing')} defaultChecked />
              <Checkbox label={t('styleguide.states.disabled')} disabled />
            </ChoiceGroup>
          </div>
          <div>
            <ChoiceGroup legend={s('card')}>
              <Radio name="payment" label={s('card')} defaultChecked />
              <Radio name="payment" label={s('wallet')} hint={s('walletSoon')} disabled />
            </ChoiceGroup>
          </div>
        </div>
      </Section>

      <Section title={t('styleguide.pickers')}>
        <div className={styles.cardDemo}>
          <Price amount={22000} compareAt={25000} size="lg" />
          <SwatchPicker
            legend={s('color')}
            value={color}
            onChange={setColor}
            options={[
              { value: 'black', label: s('black'), hex: '#111111' },
              { value: 'navy', label: s('navy'), hex: '#1f2a44' },
              { value: 'camel', label: s('camel'), hex: '#c19a6b' },
              { value: 'white', label: s('white'), hex: '#ffffff', available: false },
            ]}
          />
          <SizePicker
            legend={s('size')}
            value={size}
            onChange={setSize}
            options={['S', 'M', 'L', 'XL', 'XXL'].map((value) => ({ value, label: value, available: value !== 'XXL' }))}
          />
          <div className={styles.row}>
            <QuantityInput value={quantity} onChange={setQuantity} max={10} />
            <Button size="lg" startIcon={<ShoppingBag size={18} aria-hidden="true" />}>
              {s('addToCart')}
            </Button>
          </div>
        </div>
      </Section>

      <Section title={t('styleguide.feedback')}>
        <div className={styles.grid}>
          <Alert tone="info" title={s('infoTitle')}>
            {s('infoText')}
          </Alert>
          <Alert tone="success" title={s('successTitle')}>
            {s('successText')}
          </Alert>
          <Alert tone="warning" title={s('warningTitle')}>
            {s('warningText')}
          </Alert>
          <Alert tone="error" title={s('errorTitle')} action={<Button size="sm">{t('common.retry')}</Button>}>
            {s('errorText')}
          </Alert>
          <div>
            <span className={styles.stateLabel}>{t('styleguide.states.loading')}</span>
            <div className={styles.row}>
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" />
              <div className={styles.skeletonCard}>
                <Skeleton style={{ aspectRatio: '4 / 5' }} />
                <Skeleton style={{ height: 14, width: '80%' }} />
                <Skeleton style={{ height: 14, width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
        <div>
          <span className={styles.stateLabel}>{t('styleguide.states.empty')}</span>
          <EmptyState icon={ShoppingBag} title={s('emptyTitle')} text={s('emptyText')} action={<Button>{s('browse')}</Button>} />
        </div>
      </Section>

      <Section title={t('styleguide.badges')}>
        <div className={styles.row}>
          <Badge tone="neutral">{t('badge.new')}</Badge>
          <Badge tone="sale">{t('badge.sale')}</Badge>
          <Badge tone="dark">{t('badge.soldOut')}</Badge>
          <Badge tone="info">{t('badge.onDemand')}</Badge>
          <Badge tone="success">{t('styleguide.states.success')}</Badge>
          <Badge tone="warning">{s('warningTitle')}</Badge>
          <Badge tone="error">{t('styleguide.states.error')}</Badge>
        </div>
      </Section>

      <Section title={t('styleguide.navigation')}>
        <Breadcrumb items={[{ label: t('common.home'), to: '/' }, { label: s('shoes'), to: '/styleguide' }, { label: s('sneakers') }]} />
        <SectionTitle eyebrow={s('eyebrow')} title={s('sectionTitle')} />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}
