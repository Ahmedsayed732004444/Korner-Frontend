export interface Column {
  headerAr: string
  headerEn: string
}

export interface Row {
  size: string
  values: string[]
}

export interface Grid {
  columns: Column[]
  rows: Row[]
}

// Every row must hold exactly one value per column, so adding or removing a column edits all rows together.
export function addColumn(grid: Grid): Grid {
  return { columns: [...grid.columns, { headerAr: '', headerEn: '' }], rows: grid.rows.map((row) => ({ ...row, values: [...row.values, ''] })) }
}

export function removeColumn(grid: Grid, index: number): Grid {
  return {
    columns: grid.columns.filter((_, position) => position !== index),
    rows: grid.rows.map((row) => ({ ...row, values: row.values.filter((_, position) => position !== index) })),
  }
}

export function addRow(grid: Grid): Grid {
  return { ...grid, rows: [...grid.rows, { size: '', values: grid.columns.map(() => '') }] }
}

export function removeRow(grid: Grid, index: number): Grid {
  return { ...grid, rows: grid.rows.filter((_, position) => position !== index) }
}

export function setCell(grid: Grid, rowIndex: number, columnIndex: number, value: string): Grid {
  return {
    ...grid,
    rows: grid.rows.map((row, position) => (position === rowIndex ? { ...row, values: row.values.map((cell, at) => (at === columnIndex ? value : cell)) } : row)),
  }
}

export function setSize(grid: Grid, rowIndex: number, size: string): Grid {
  return { ...grid, rows: grid.rows.map((row, position) => (position === rowIndex ? { ...row, size } : row)) }
}

export function setHeader(grid: Grid, columnIndex: number, header: Partial<Column>): Grid {
  return { ...grid, columns: grid.columns.map((column, position) => (position === columnIndex ? { ...column, ...header } : column)) }
}

export type GridProblem = 'columns' | 'rows' | 'headers' | 'sizes' | 'duplicateSizes' | 'cells'

// The same rules the API checks, so the editor can point at the problem before saving.
export function gridProblems(grid: Grid): GridProblem[] {
  const problems: GridProblem[] = []
  if (grid.columns.length === 0) problems.push('columns')
  if (grid.rows.length === 0) problems.push('rows')
  if (grid.columns.some((column) => !column.headerAr.trim() || !column.headerEn.trim())) problems.push('headers')
  if (grid.rows.some((row) => !row.size.trim())) problems.push('sizes')
  const sizes = grid.rows.map((row) => row.size.trim().toLowerCase()).filter(Boolean)
  if (new Set(sizes).size !== sizes.length) problems.push('duplicateSizes')
  if (grid.rows.some((row) => row.values.some((cell) => !cell.trim()))) problems.push('cells')
  return problems
}
