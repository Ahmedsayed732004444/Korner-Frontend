// 1 … 4 5 [6] 7 8 … 20 : always the first and last page, and two on each side of the current one.
export function pageWindow(page: number, totalPages: number): (number | 'gap')[] {
  const wanted = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2])
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)

  return pages.flatMap((p, index) => (index > 0 && p - pages[index - 1] > 1 ? ['gap' as const, p] : [p]))
}
