import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { categoryActions, useCategoryTree, type CategoryNode } from '@/features/adminLookups'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Badge, Button, Checkbox, Input, Select, Skeleton } from '@/shared/ui'
import { ImageField } from './ImageField'
import styles from '../Admin.module.scss'

interface Flat {
  node: CategoryNode
  depth: number
}

function flatten(nodes: CategoryNode[], depth = 0): Flat[] {
  return nodes.flatMap((node) => [{ node, depth }, ...flatten(node.children, depth + 1)])
}

function descendantIds(node: CategoryNode): string[] {
  return node.children.flatMap((child) => [child.id, ...descendantIds(child)])
}

export function CategoriesTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: tree, isLoading, error } = useCategoryTree()
  const remove = categoryActions.useDelete()
  // undefined = form closed, null = adding, a node = editing it.
  const [editing, setEditing] = useState<CategoryNode | null | undefined>(undefined)
  const rows = flatten(tree ?? [])

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.lookups.categories')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing(null)}>{t('admin.lookups.addCategory')}</Button>}
      </div>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}
      {isLoading && <Skeleton style={{ height: 160 }} />}

      {editing !== undefined && <CategoryForm key={editing?.id ?? 'new'} category={editing} tree={tree ?? []} onDone={() => setEditing(undefined)} />}

      <ul className={styles.list}>
        {rows.map(({ node, depth }) => (
          <li key={node.id} className={styles.lookupRow} style={{ paddingInlineStart: `${depth * 24}px` }}>
            <span>
              <strong>{localize(node.nameAr, node.nameEn)}</strong> {!node.isActive && <Badge tone="warning">{t('admin.products.inactive')}</Badge>}
              <small>{localize(node.slugAr, node.slugEn)}</small>
            </span>
            {canWrite && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(node)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove.mutate(node.id)} loading={remove.isPending && remove.variables === node.id}>
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

function CategoryForm({ category, tree, onDone }: { category: CategoryNode | null; tree: CategoryNode[]; onDone: () => void }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const save = categoryActions.useSave()
  const image = categoryActions.useImage()
  const [saved, setSaved] = useState<CategoryNode | null>(category)
  const [nameAr, setNameAr] = useState(category?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(category?.nameEn ?? '')
  const [slugAr, setSlugAr] = useState(category?.slugAr ?? '')
  const [slugEn, setSlugEn] = useState(category?.slugEn ?? '')
  const [parentId, setParentId] = useState(category?.parentId ?? '')
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0))
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [errors, setErrors] = useState<{ nameAr?: string; nameEn?: string }>({})

  // A category can't move under itself or its own children.
  const blocked = new Set(category ? [category.id, ...descendantIds(category)] : [])
  const parents = flatten(tree).filter(({ node }) => !blocked.has(node.id))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const found = { nameAr: nameAr.trim() ? undefined : required, nameEn: nameEn.trim() ? undefined : required }
    setErrors(found)
    if (found.nameAr || found.nameEn) return

    save.mutate(
      {
        id: saved?.id ?? null,
        input: { nameAr: nameAr.trim(), nameEn: nameEn.trim(), slugAr: slugAr.trim() || null, slugEn: slugEn.trim() || null, parentId: parentId || null, sortOrder: Number(sortOrder) || 0, isActive },
      },
      // A new category stays open so its picture can be added right away.
      { onSuccess: (result) => (saved ? onDone() : setSaved(result)) },
    )
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{category ? t('admin.lookups.editCategory') : t('admin.lookups.addCategory')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      <div className={styles.twoCols}>
        <Input label={t('admin.products.nameAr')} value={nameAr} onChange={(event) => { setNameAr(event.target.value); setErrors((c) => ({ ...c, nameAr: undefined })) }} error={errors.nameAr} required />
        <Input label={t('admin.products.nameEn')} dir="ltr" value={nameEn} onChange={(event) => { setNameEn(event.target.value); setErrors((c) => ({ ...c, nameEn: undefined })) }} error={errors.nameEn} required />
        <Input label={t('admin.products.slugAr')} hint={t('admin.products.slugHint')} optional value={slugAr} onChange={(event) => setSlugAr(event.target.value)} />
        <Input label={t('admin.products.slugEn')} hint={t('admin.products.slugHint')} optional dir="ltr" value={slugEn} onChange={(event) => setSlugEn(event.target.value)} />
        <Select
          label={t('admin.lookups.parent')}
          optional
          placeholder={t('admin.lookups.topLevel')}
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
          options={parents.map(({ node, depth }) => ({ value: node.id, label: `${'— '.repeat(depth)}${localize(node.nameAr, node.nameEn)}` }))}
        />
        <Input label={t('admin.products.sortOrder')} type="number" optional value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
      </div>
      <Checkbox checked={isActive} onChange={(event) => setIsActive(event.target.checked)} label={t('admin.lookups.visible')} />
      {saved && !category && <Alert tone="success" title={t('account.saved')} />}
      {saved && (
        <ImageField label={t('admin.lookups.image')} currentUrl={saved.imageUrl} pending={image.isPending} error={image.error} onUpload={(file) => image.mutate({ id: saved.id, file }, { onSuccess: () => onDone() })} />
      )}
      <div className={styles.actions}>
        <Button type="submit" loading={save.isPending}>
          {t('account.save')}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          {saved && !category ? t('common.close') : t('account.cancelEdit')}
        </Button>
      </div>
    </form>
  )
}
