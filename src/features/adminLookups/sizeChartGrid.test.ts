import { describe, expect, it } from 'vitest'
import { addColumn, addRow, gridProblems, removeColumn, setCell, setHeader, setSize, type Grid } from './sizeChartGrid'

const empty: Grid = { columns: [], rows: [] }

function filled(): Grid {
  let grid = addColumn(empty)
  grid = setHeader(grid, 0, { headerAr: 'الصدر', headerEn: 'Chest' })
  grid = addRow(grid)
  grid = setSize(grid, 0, 'M')
  return setCell(grid, 0, 0, '100')
}

describe('size chart grid', () => {
  it('keeps every row as wide as the columns', () => {
    let grid = addRow(addRow(addColumn(empty)))
    grid = addColumn(grid)
    expect(grid.rows.every((row) => row.values.length === 2)).toBe(true)
    grid = removeColumn(grid, 0)
    expect(grid.rows.every((row) => row.values.length === 1)).toBe(true)
  })

  it('a new row starts with one empty cell per column', () => {
    expect(addRow(addColumn(addColumn(empty))).rows[0].values).toEqual(['', ''])
  })

  it('changes only the addressed cell', () => {
    const grid = setCell(addRow(addRow(addColumn(empty))), 1, 0, '95')
    expect(grid.rows.map((row) => row.values[0])).toEqual(['', '95'])
  })
})

describe('gridProblems', () => {
  it('accepts a complete chart', () => {
    expect(gridProblems(filled())).toEqual([])
  })

  it('lists what is missing', () => {
    expect(gridProblems(empty)).toEqual(['columns', 'rows'])
    expect(gridProblems(addRow(addColumn(empty)))).toEqual(['headers', 'sizes', 'cells'])
  })

  it('catches the same size twice, ignoring case and spaces', () => {
    let grid = filled()
    grid = setCell(setSize(addRow(grid), 1, ' m '), 1, 0, '101')
    expect(gridProblems(grid)).toEqual(['duplicateSizes'])
  })
})
