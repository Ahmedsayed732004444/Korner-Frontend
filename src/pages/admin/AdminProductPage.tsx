import { useState } from 'react'
import { PackageX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAdminProduct,
  useChangeProductStatus,
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  type AdminProduct,
  type ProductStatus,
} from '@/features/adminCatalog'
import { ApiError, errorMessage, usePermissions } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Permissions } from '@/shared/lib/permissions'
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle'
import { Alert, Badge, Button, EmptyState, Skeleton } from '@/shared/ui'
import { ImagesSection } from './product/ImagesSection'
import { ProductForm } from './product/ProductForm'
import { VariantsSection } from './product/VariantsSection'
import styles from './Admin.module.scss'

export function AdminProductPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const isNew = id === undefined
  const { data: product, isLoading, error } = useAdminProduct(isNew ? null : id)
  const { can } = usePermissions()
  useDocumentTitle(isNew ? t('admin.products.add') : undefined)

  if (!can(Permissions.catalogRead)) return <Alert tone="warning" title={t('admin.noAccessText')} />
  if (isNew) return <NewProduct />
  if (isLoading) return <Skeleton style={{ height: 360 }} />

  if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
    return <EmptyState icon={PackageX} title={t('admin.products.missing')} action={<Link to="/admin/products">{t('admin.nav.products')}</Link>} />
  }

  if (error || !product) return <Alert tone="error" title={errorMessage(error, t)} />

  return <EditProduct key={product.id} product={product} canWrite={can(Permissions.catalogWrite)} />
}

function NewProduct() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const create = useCreateProduct()

  return (
    <>
      <p>
        <Link to="/admin/products">{t('admin.products.back')}</Link>
      </p>
      <h1>{t('admin.products.add')}</h1>
      <p>{t('admin.products.newHint')}</p>
      <ProductForm product={null} saving={create.isPending} error={create.error} onSubmit={(input) => create.mutate(input, { onSuccess: (created) => navigate(`/admin/products/${created.id}`) })} />
    </>
  )
}

function EditProduct({ product, canWrite }: { product: AdminProduct; canWrite: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const navigate = useNavigate()
  const update = useUpdateProduct(product.id)

  return (
    <>
      <p>
        <Link to="/admin/products">{t('admin.products.back')}</Link>
      </p>
      <div className={styles.headRow}>
        <h1>{localize(product.nameAr, product.nameEn)}</h1>
        <Badge tone={product.status === 'Published' ? 'success' : product.status === 'Draft' ? 'warning' : 'info'}>{t(`admin.products.status.${product.status}`)}</Badge>
      </div>

      {canWrite && <StatusPanel product={product} onDeleted={() => navigate('/admin/products')} />}

      {update.isSuccess && <Alert tone="success" title={t('account.saved')} />}
      <fieldset disabled={!canWrite} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <ProductForm product={product} saving={update.isPending} error={update.error} onSubmit={(input) => update.mutate(input)} />
      </fieldset>
      <VariantsSection product={product} />
      <ImagesSection product={product} />
    </>
  )
}

function StatusPanel({ product, onDeleted }: { product: AdminProduct; onDeleted: () => void }) {
  const { t } = useTranslation()
  const change = useChangeProductStatus(product.id)
  const remove = useDeleteProduct()
  const [confirming, setConfirming] = useState(false)
  const targets: ProductStatus[] = (['Published', 'Hidden', 'Draft'] as const).filter((status) => status !== product.status)
  const error = change.error ?? remove.error

  return (
    <section className={styles.panel}>
      <h2>{t('admin.products.visibility')}</h2>
      {error != null && <Alert tone="error" title={errorMessage(error, t)} />}
      {product.publishIssues.length > 0 && product.status !== 'Published' && (
        <Alert tone="warning" title={t('admin.products.notReady')}>
          {product.publishIssues.map((issue) => t(`admin.products.issue.${issue}`, { defaultValue: issue })).join(' · ')}
        </Alert>
      )}
      <div className={styles.actions}>
        {targets.map((status) => (
          <Button key={status} variant={status === 'Published' ? 'primary' : 'secondary'} onClick={() => change.mutate(status)} loading={change.isPending && change.variables === status}>
            {t(`admin.products.moveTo.${status}`)}
          </Button>
        ))}
        {confirming ? (
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              {t('track.keep')}
            </Button>
            <Button onClick={() => remove.mutate(product.id, { onSuccess: onDeleted })} loading={remove.isPending}>
              {t('admin.products.deleteYes')}
            </Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            {t('admin.products.delete')}
          </Button>
        )}
      </div>
    </section>
  )
}
