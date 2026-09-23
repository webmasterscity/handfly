import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import type { Lang, Localized } from '../core/modules/types'
import { onLanguageChange, resolveLanguage } from '../core/settings/settings'
import esCore from './es/core.json'
import esThinkFirst from './es/think-first.json'
import esRecall from './es/recall.json'
import esPeople from './es/people.json'
import esNavigation from './es/navigation.json'
import esWriting from './es/writing.json'
import esCalculation from './es/calculation.json'
import enCore from './en/core.json'
import enThinkFirst from './en/think-first.json'
import enRecall from './en/recall.json'
import enPeople from './en/people.json'
import enNavigation from './en/navigation.json'
import enWriting from './en/writing.json'
import enCalculation from './en/calculation.json'

// Para añadir un idioma: crear src/i18n/<lang>/ con los mismos archivos, registrarlo aquí,
// añadirlo a LANGUAGES (core/modules/types.ts) y traducir los metadatos de evidencia.
export const resources = {
  es: {
    core: esCore,
    'think-first': esThinkFirst,
    recall: esRecall,
    people: esPeople,
    navigation: esNavigation,
    writing: esWriting,
    calculation: esCalculation,
  },
  en: {
    core: enCore,
    'think-first': enThinkFirst,
    recall: enRecall,
    people: enPeople,
    navigation: enNavigation,
    writing: enWriting,
    calculation: enCalculation,
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(),
  fallbackLng: 'es',
  defaultNS: 'core',
  ns: Object.keys(resources.es),
  interpolation: { escapeValue: false },
  returnNull: false,
})

onLanguageChange((lang) => {
  if (i18n.language !== lang) void i18n.changeLanguage(lang)
})

/** Devuelve el texto de un campo Localized en el idioma activo. */
export function useLocalized() {
  const { i18n: inst } = useTranslation()
  const lang = (inst.language.startsWith('en') ? 'en' : 'es') as Lang
  return (text: Localized) => text[lang] ?? text.es
}

export default i18n
