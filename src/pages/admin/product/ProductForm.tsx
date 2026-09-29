import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useBrandOptions,
  useCategoryOptions,
  useSizeChartOptions,
  type AdminProduct,
  type CategoryOption,
  type Concentration,
  type PerfumeFields,
  type ProductInput,
  type ProductType,
} from '@/features/adminCatalog'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, Input, Select, Textarea } from '@/shared/ui'
import styles from '../Admin.module.scss'

interface ProductFormProps {
  product: AdminProduct | null
  saving: boolean
  error: unknown
  onSubmit: (input: ProductInput) => void
}

const types: ProductType[] = ['Apparel', 'Footwear', 'Perfume']
const concentrations: Concentration[] = ['EauDeToilette', 'EauDeParfum', 'Parfum']

const emptyPerfume: PerfumeFields = {
  concentration: 'EauDeParfum',
  scentFamilyAr: '',
  scentFamilyEn: '',
  topNotesAr: null,
  topNotesEn: null,
  heartNotesAr: null,
  heartNotesEn: null,
  baseNotesAr: null,
  baseNotesEn: null,
}

function flatten(tree: CategoryOption[] | undefined, depth = 0): { id: string; nameAr: string; nameEn: string; depth: number }[] {
  return (tree ?? []).flatMap((node) => [{ id: node.id, nameAr: node.nameAr, nameEn: node.nameEn, depth }, ...flatten(node.children, depth + 1)])
}

const orNull = (value: string) => value.trim() || null

// One form for creating and editing. Fields the form doesn't show (SEO texts) are sent back unchanged so saving never erases them.
export function ProductForm({ product, saving, error, onSubmit }: ProductFormProps) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: categories } = useCategoryOptions()
  const { data: brands } = useBrandOptions()
  const { data: charts } = useSizeChartOptions()

  const [nameAr, setNameAr] = useState(product?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(product?.nameEn ?? '')
  const [descriptionAr, setDescriptionAr] = useState(product?.descriptionAr ?? '')
  const [descriptionEn, setDescriptionEn] = useState(product?.descriptionEn ?? '')
  const [slugAr, setSlugAr] = useState(product?.slugAr ?? '')
  const [slugEn, setSlugEn] = useState(product?.slugEn ?? '')
  const [type, setType] = useState<ProductType>(product?.type ?? 'Apparel')
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? '')
  const [brandId, setBrandId] = useState(product?.brandId ?? '')
  const [sizeChartId, setSizeChartId] = useState(product?.sizeChartId ?? '')
  const [perfume, setPerfume] = useState<PerfumeFields>(product?.perfume ?? emptyPerfume)
  const [errors, setErrors] = useState<Partial<Record<'nameAr' | 'nameEn' | 'categoryId' | 'scent', string>>>({})

  const setNote = (key: keyof PerfumeFields) => (event: { target: { value: string } }) => setPerfume((current) => ({ ...current, [key]: event.target.value }))
  const optionalNote = (key: keyof PerfumeFields) => (event: { target: { value: string } }) => setPerfume((current) => ({ ...current, [key]: orNull(event.target.value) }))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const found: typeof errors = {}
    if (!nameAr.trim()) found.nameAr = required
    if (!nameEn.trim()) found.nameEn = required
    if (!categoryId) found.categoryId = required
    if (type === 'Perfume' && (!perfume.scentFamilyAr.trim() || !perfume.scentFamilyEn.trim())) found.scent = required
    setErrors(found)
    if (Object.keys(found).length > 0) return

    onSubmit({
      nameAr: nameAr.trim(),
      nameEn: nameEn.trim(),
      descriptionAr: orNull(descriptionAr),
      descriptionEn: orNull(descriptionEn),
      slugAr: orNull(slugAr),
      slugEn: orNull(slugEn),
      metaTitleAr: product?.metaTitleAr ?? null,
      metaTitleEn: product?.metaTitleEn ?? null,
      metaDescriptionAr: product?.metaDescriptionAr ?? null,
      metaDescriptionEn: product?.metaDescriptionEn ?? null,
      type,
      categoryId,
      brandId: brandId || null,
      sizeChartId: type === 'Perfume' ? null : sizeChartId || null,
      perfume: type === 'Perfume' ? perfume : null,
    })
  }

  return (
    <form className={styles.panel} onSubmit={submit} noValidate>
      <h2>{t('admin.products.general')}</h2>
      {error != null && <Alert tone="error" title={errorMessage(error, t)} />}

      <div className={styles.twoCols}>
        <Input label={t('admin.products.nameAr')} value={nameAr} onChange={(event) => { setNameAr(event.target.value); setErrors((c) => ({ ...c, nameAr: undefined })) }} error={errors.nameAr} required />
        <Input label={t('admin.products.nameEn')} dir="ltr" value={nameEn} onChange={(event) => { setNameEn(event.target.value); setErrors((c) => ({ ...c, nameEn: undefined })) }} error={errors.nameEn} required />
        <Textarea label={t('admin.products.descriptionAr')} optional value={descriptionAr} onChange={(event) => setDescriptionAr(event.target.value)} />
        <Textarea label={t('admin.products.descriptionEn')} optional dir="ltr" value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} />
        <Input label={t('admin.products.slugAr')} hint={t('admin.products.slugHint')} optional value={slugAr} onChange={(event) => setSlugAr(event.target.value)} />
        <Input label={t('admin.products.slugEn')} hint={t('admin.products.slugHint')} optional dir="ltr" value={slugEn} onChange={(event) => setSlugEn(event.target.value)} />
      </div>

      <div className={styles.twoCols}>
        <Select
          label={t('admin.products.type')}
          value={type}
          onChange={(event) => setType(event.target.value as ProductType)}
          options={types.map((item) => ({ value: item, label: t(`admin.products.types.${item}`) }))}
        />
        <Select
          label={t('admin.products.category')}
          placeholder={t('admin.products.choose')}
          value={categoryId}
          onChange={(event) => { setCategoryId(event.target.value); setErrors((c) => ({ ...c, categoryId: undefined })) }}
          options={flatten(categories).map((item) => ({ value: item.id, label: `${'— '.repeat(item.depth)}${localize(item.nameAr, item.nameEn)}` }))}
          error={errors.categoryId}
          required
        />
        <Select
          label={t('admin.products.brand')}
          optional
          placeholder={t('admin.products.none_')}
          value={brandId}
          onChange={(event) => setBrandId(event.target.value)}
          options={(brands ?? []).map((item) => ({ value: item.id, label: localize(item.nameAr, item.nameEn) }))}
        />
        {type !== 'Perfume' && (
          <Select
            label={t('admin.products.sizeChart')}
            optional
            placeholder={t('admin.products.none_')}
            value={sizeChartId}
            onChange={(event) => setSizeChartId(event.target.value)}
            options={(charts ?? []).map((item) => ({ value: item.id, label: localize(item.nameAr, item.nameEn) }))}
          />
        )}
      </div>

      {type === 'Perfume' && (
        <>
          <h2>{t('admin.products.scent')}</h2>
          {errors.scent && <Alert tone="error" title={errors.scent} />}
          <div className={styles.twoCols}>
            <Select
              label={t('product.perfume.concentration')}
              value={perfume.concentration}
              onChange={(event) => setPerfume((current) => ({ ...current, concentration: event.target.value as Concentration }))}
              options={concentrations.map((item) => ({ value: item, label: t(`product.perfume.${item}`) }))}
            />
            <span />
            <Input label={`${t('product.perfume.family')} (ع)`} value={perfume.scentFamilyAr} onChange={setNote('scentFamilyAr')} required />
            <Input label={`${t('product.perfume.family')} (EN)`} dir="ltr" value={perfume.scentFamilyEn} onChange={setNote('scentFamilyEn')} required />
            <Input label={`${t('product.perfume.top')} (ع)`} optional value={perfume.topNotesAr ?? ''} onChange={optionalNote('topNotesAr')} />
            <Input label={`${t('product.perfume.top')} (EN)`} optional dir="ltr" value={perfume.topNotesEn ?? ''} onChange={optionalNote('topNotesEn')} />
            <Input label={`${t('product.perfume.heart')} (ع)`} optional value={perfume.heartNotesAr ?? ''} onChange={optionalNote('heartNotesAr')} />
            <Input label={`${t('product.perfume.heart')} (EN)`} optional dir="ltr" value={perfume.heartNotesEn ?? ''} onChange={optionalNote('heartNotesEn')} />
            <Input label={`${t('product.perfume.base')} (ع)`} optional value={perfume.baseNotesAr ?? ''} onChange={optionalNote('baseNotesAr')} />
            <Input label={`${t('product.perfume.base')} (EN)`} optional dir="ltr" value={perfume.baseNotesEn ?? ''} onChange={optionalNote('baseNotesEn')} />
          </div>
        </>
      )}

      <div>
        <Button type="submit" loading={saving}>
          {product ? t('account.save') : t('admin.products.create')}
        </Button>
      </div>
    </form>
  )
}
