import { useTranslation } from 'react-i18next'

// The API sends both languages side by side (NameAr / NameEn); this picks the one for the current language.
export function useLocalize() {
  const { i18n } = useTranslation()
  const arabic = i18n.language === 'ar'
  return <T>(ar: T, en: T): T => (arabic ? ar : en)
}
