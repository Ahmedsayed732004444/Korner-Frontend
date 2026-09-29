import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'
import en from './locales/en.json'

export const languages = ['ar', 'en'] as const
export type Language = (typeof languages)[number]

const storageKey = 'korner.language'

// A `?lang=en` link opens the site in that language; otherwise the visitor's last choice, else Arabic.
function savedLanguage(): Language {
  const fromUrl = new URLSearchParams(window.location.search).get('lang')
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl

  try {
    const value = localStorage.getItem(storageKey)
    return value === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

function applyToDocument(language: string) {
  document.documentElement.lang = language
  document.documentElement.dir = i18n.dir(language)
  try {
    localStorage.setItem(storageKey, language)
  } catch {
    // Private mode or blocked storage: the language just isn't remembered.
  }
}

i18n.on('languageChanged', applyToDocument)

void i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: savedLanguage(),
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
})

applyToDocument(i18n.language)

export default i18n
