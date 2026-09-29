import { useState } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  useColorOptions,
  useDeleteImage,
  useReorderImages,
  useUpdateImage,
  useUploadImages,
  type AdminImage,
  type AdminProduct,
} from '@/features/adminCatalog'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, Select } from '@/shared/ui'
import styles from '../Admin.module.scss'

export function ImagesSection({ product }: { product: AdminProduct }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: colors } = useColorOptions()
  const upload = useUploadImages(product.id)
  const remove = useDeleteImage(product.id)
  const reorder = useReorderImages(product.id)
  const update = useUpdateImage(product.id)
  const [files, setFiles] = useState<File[]>([])
  const [colorId, setColorId] = useState('')
  const [inputKey, setInputKey] = useState(0)
  const error = upload.error ?? remove.error ?? reorder.error ?? update.error

  const images = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder)
  const colorOptions = [{ value: '', label: t('admin.products.allColors') }, ...(colors ?? []).map((item) => ({ value: item.id, label: localize(item.nameAr, item.nameEn) }))]

  const move = (index: number, direction: -1 | 1) => {
    const ids = images.map((image) => image.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate(ids)
  }

  const setColor = (image: AdminImage, value: string) => update.mutate({ id: image.id, colorId: value || null, altAr: image.altAr, altEn: image.altEn })

  return (
    <section className={styles.panel}>
      <h2>{t('admin.products.imagesTitle')}</h2>
      {error != null && <Alert tone="error" title={errorMessage(error, t)} />}

      <div className={styles.form}>
        <input key={inputKey} type="file" accept="image/*" multiple aria-label={t('admin.actions.photos')} onChange={(event) => setFiles(Array.from(event.target.files ?? []))} />
        <Select label={t('admin.products.imageColor')} hint={t('admin.products.imageColorHint')} value={colorId} onChange={(event) => setColorId(event.target.value)} options={colorOptions} />
        <div>
          <Button
            disabled={files.length === 0}
            loading={upload.isPending}
            onClick={() =>
              upload.mutate(
                { files, colorId: colorId || null },
                {
                  onSuccess: () => {
                    setFiles([])
                    setInputKey((key) => key + 1)
                  },
                },
              )
            }
          >
            {t('admin.products.upload', { count: files.length })}
          </Button>
        </div>
      </div>

      {images.length === 0 && <p>{t('admin.products.noImages')}</p>}

      <ul className={styles.images}>
        {images.map((image, index) => (
          <li key={image.id}>
            <img src={image.url} alt={image.altEn ?? ''} width={120} height={150} loading="lazy" />
            <Select label={t('product.color')} value={image.colorId ?? ''} onChange={(event) => setColor(image, event.target.value)} options={colorOptions} />
            <span className={styles.actions}>
              <Button size="sm" variant="secondary" onClick={() => move(index, -1)} disabled={index === 0 || reorder.isPending} aria-label={t('admin.products.moveUp')}>
                <ArrowUp size={16} aria-hidden="true" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => move(index, 1)} disabled={index === images.length - 1 || reorder.isPending} aria-label={t('admin.products.moveDown')}>
                <ArrowDown size={16} aria-hidden="true" />
              </Button>
              <Button size="sm" variant="secondary" onClick={() => remove.mutate(image.id)} loading={remove.isPending && remove.variables === image.id} aria-label={t('account.delete')}>
                <Trash2 size={16} aria-hidden="true" />
              </Button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
