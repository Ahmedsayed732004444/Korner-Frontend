import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ar from './locales/ar.json'

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

// The staff screens' text comes with the staff area.
// Arabic (almost every visitor) ships with the page so the first screen needs no extra request; English loads when chosen.
const shopText = { ar: async () => ({ default: ar }), en: () => import('./locales/en.json') }
const staffText = { ar: () => import('./locales/staff.ar.json'), en: () => import('./locales/staff.en.json') }
let staffWanted = false

async function load(language: Language) {
  const bundles = [shopText[language](), ...(staffWanted ? [staffText[language]()] : [])]
  for (const bundle of await Promise.all(bundles)) i18n.addResourceBundle(language, 'translation', bundle.default, true, true)
}

export async function initI18n() {
  const language = savedLanguage()
  await i18n.use(initReactI18next).init({ resources: {}, partialBundledLanguages: true, lng: language, fallbackLng: false, interpolation: { escapeValue: false } })
  await load(language)
  applyToDocument(language)
}

export async function switchLanguage(language: Language) {
  await load(language)
  await i18n.changeLanguage(language)
}

export async function loadStaffText() {
  staffWanted = true
  await load(i18n.language === 'en' ? 'en' : 'ar')
}

export default i18n
