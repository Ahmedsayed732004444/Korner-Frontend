import { useEffect } from 'react'

const suffix = 'Korner'

// The browser tab, history and search results show the page's own name.
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} | ${suffix}` : suffix
    return () => {
      document.title = suffix
    }
  }, [title])
}
