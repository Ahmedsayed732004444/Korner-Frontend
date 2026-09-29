import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { clearFilters, parseListing, writeListing, type ListingState } from './filters'

// The list's filters, sort and page live in the URL. Any change except paging goes back to page 1.
export function useListing() {
  const [search, setSearch] = useSearchParams()
  const state = useMemo(() => parseListing(search), [search])

  const update = useCallback(
    (patch: Partial<ListingState>) => {
      setSearch(
        (current) => {
          const previous = parseListing(current)
          const next = { ...previous, ...patch }
          if (!('page' in patch)) next.page = 1
          return writeListing(next, current)
        },
        { replace: false },
      )
    },
    [setSearch],
  )

  const clear = useCallback(() => {
    setSearch((current) => writeListing(clearFilters(parseListing(current)), current))
  }, [setSearch])

  return { state, update, clear }
}
