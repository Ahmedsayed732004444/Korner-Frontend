import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  addColumn,
  addRow,
  gridProblems,
  removeColumn,
  removeRow,
  setCell,
  setHeader,
  setSize,
  sizeChartActions,
  useBrands,
  useSizeChart,
  useSizeCharts,
  type Grid,
  type ProductType,
  type SizeChart,
} from '@/features/adminLookups'
import { errorMessage } from '@/shared/api'
import { useLocalize } from '@/shared/lib/localize'
import { Alert, Button, Input, Select, Skeleton, Textarea } from '@/shared/ui'
import styles from '../Admin.module.scss'

const types: ProductType[] = ['Apparel', 'Footwear', 'Perfume']

export function SizeChartsTab({ canWrite }: { canWrite: boolean }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: charts, isLoading, error } = useSizeCharts()
  const remove = sizeChartActions.useDelete()
  // undefined = closed, 'new' = adding, an id = editing that chart.
  const [editing, setEditing] = useState<string | 'new' | undefined>(undefined)

  return (
    <section className={styles.panel}>
      <div className={styles.headRow}>
        <h2>{t('admin.lookups.sizeCharts')}</h2>
        {canWrite && editing === undefined && <Button onClick={() => setEditing('new')}>{t('admin.lookups.addChart')}</Button>}
      </div>
      {error && <Alert tone="error" title={errorMessage(error, t)} />}
      {remove.error && <Alert tone="error" title={errorMessage(remove.error, t)} />}
      {isLoading && <Skeleton style={{ height: 120 }} />}

      {editing !== undefined && <ChartLoader key={editing} id={editing === 'new' ? null : editing} onDone={() => setEditing(undefined)} />}

      <ul className={styles.list}>
        {charts?.map((chart) => (
          <li key={chart.id} className={styles.lookupRow}>
            <span>
              <strong>{localize(chart.nameAr, chart.nameEn)}</strong>
              <small>{[chart.productType && t(`admin.products.types.${chart.productType}`), chart.brandNameEn].filter(Boolean).join(' · ')}</small>
            </span>
            {canWrite && (
              <span className={styles.actions}>
                <Button size="sm" variant="secondary" onClick={() => setEditing(chart.id)}>
                  {t('account.edit')}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove.mutate(chart.id)} loading={remove.isPending && remove.variables === chart.id}>
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

function ChartLoader({ id, onDone }: { id: string | null; onDone: () => void }) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useSizeChart(id)
  if (id && isLoading) return <Skeleton style={{ height: 200 }} />
  if (id && (error || !data)) return <Alert tone="error" title={errorMessage(error, t)} />
  return <ChartForm chart={data ?? null} onDone={onDone} />
}

function ChartForm({ chart, onDone }: { chart: SizeChart | null; onDone: () => void }) {
  const { t } = useTranslation()
  const localize = useLocalize()
  const { data: brands } = useBrands()
  const save = sizeChartActions.useSave()
  const [nameAr, setNameAr] = useState(chart?.nameAr ?? '')
  const [nameEn, setNameEn] = useState(chart?.nameEn ?? '')
  const [notesAr, setNotesAr] = useState(chart?.notesAr ?? '')
  const [notesEn, setNotesEn] = useState(chart?.notesEn ?? '')
  const [productType, setProductType] = useState<ProductType | ''>(chart?.productType ?? '')
  const [brandId, setBrandId] = useState(chart?.brandId ?? '')
  const [grid, setGrid] = useState<Grid>({ columns: chart?.columns ?? [], rows: chart?.rows ?? [] })
  const [errors, setErrors] = useState<{ nameAr?: string; nameEn?: string; grid?: string[] }>({})

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const required = t('checkout.errors.required')
    const problems = gridProblems(grid)
    const found = { nameAr: nameAr.trim() ? undefined : required, nameEn: nameEn.trim() ? undefined : required, grid: problems.map((problem) => t(`admin.lookups.gridProblem.${problem}`)) }
    setErrors(found)
    if (found.nameAr || found.nameEn || problems.length > 0) return

    save.mutate(
      {
        id: chart?.id ?? null,
        input: {
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          notesAr: notesAr.trim() || null,
          notesEn: notesEn.trim() || null,
          productType: productType || null,
          brandId: brandId || null,
          columns: grid.columns.map((column) => ({ headerAr: column.headerAr.trim(), headerEn: column.headerEn.trim() })),
          rows: grid.rows.map((row) => ({ size: row.size.trim(), values: row.values.map((cell) => cell.trim()) })),
        },
      },
      { onSuccess: onDone },
    )
  }

  const change = (next: Grid) => {
    setGrid(next)
    setErrors((current) => ({ ...current, grid: undefined }))
  }

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      <h3>{chart ? t('admin.lookups.editChart') : t('admin.lookups.addChart')}</h3>
      {save.error && <Alert tone="error" title={errorMessage(save.error, t)} />}
      {errors.grid && errors.grid.length > 0 && <Alert tone="error" title={errors.grid.join(' · ')} />}
      <div className={styles.twoCols}>
        <Input label={t('admin.products.nameAr')} value={nameAr} onChange={(event) => { setNameAr(event.target.value); setErrors((c) => ({ ...c, nameAr: undefined })) }} error={errors.nameAr} required />
        <Input label={t('admin.products.nameEn')} dir="ltr" value={nameEn} onChange={(event) => { setNameEn(event.target.value); setErrors((c) => ({ ...c, nameEn: undefined })) }} error={errors.nameEn} required />
        <Select label={t('admin.products.type')} optional placeholder={t('admin.lookups.anyType')} value={productType} onChange={(event) => setProductType(event.target.value as ProductType | '')} options={types.map((item) => ({ value: item, label: t(`admin.products.types.${item}`) }))} />
        <Select label={t('admin.products.brand')} optional placeholder={t('admin.lookups.anyBrand')} value={brandId} onChange={(event) => setBrandId(event.target.value)} options={(brands ?? []).map((item) => ({ value: item.id, label: localize(item.nameAr, item.nameEn) }))} />
        <Textarea label={t('admin.lookups.notesAr')} optional value={notesAr} onChange={(event) => setNotesAr(event.target.value)} />
        <Textarea label={t('admin.lookups.notesEn')} optional dir="ltr" value={notesEn} onChange={(event) => setNotesEn(event.target.value)} />
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ minWidth: 0 }}>
          <thead>
            <tr>
              <th scope="col">{t('product.size')}</th>
              {grid.columns.map((column, index) => (
                <th key={index} scope="col">
                  <input aria-label={`${t('admin.lookups.header')} ${index + 1} (ع)`} className={styles.cellInput} value={column.headerAr} onChange={(event) => change(setHeader(grid, index, { headerAr: event.target.value }))} />
                  <input aria-label={`${t('admin.lookups.header')} ${index + 1} (EN)`} className={styles.cellInput} dir="ltr" value={column.headerEn} onChange={(event) => change(setHeader(grid, index, { headerEn: event.target.value }))} />
                  <Button size="sm" variant="ghost" onClick={() => change(removeColumn(grid, index))} aria-label={t('admin.lookups.removeColumn')}>
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </th>
              ))}
              <th scope="col">
                <Button size="sm" variant="secondary" onClick={() => change(addColumn(grid))} startIcon={<Plus size={14} aria-hidden="true" />}>
                  {t('admin.lookups.addColumn')}
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                <td>
                  <input aria-label={t('product.size')} className={styles.cellInput} dir="ltr" value={row.size} onChange={(event) => change(setSize(grid, rowIndex, event.target.value))} />
                </td>
                {row.values.map((cell, columnIndex) => (
                  <td key={columnIndex}>
                    <input aria-label={`${t('product.size')} ${row.size || rowIndex + 1}`} className={styles.cellInput} dir="ltr" value={cell} onChange={(event) => change(setCell(grid, rowIndex, columnIndex, event.target.value))} />
                  </td>
                ))}
                <td>
                  <Button size="sm" variant="ghost" onClick={() => change(removeRow(grid, rowIndex))} aria-label={t('admin.lookups.removeRow')}>
                    <Trash2 size={14} aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <Button variant="secondary" onClick={() => change(addRow(grid))} startIcon={<Plus size={14} aria-hidden="true" />}>
          {t('admin.lookups.addRow')}
        </Button>
      </div>

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
