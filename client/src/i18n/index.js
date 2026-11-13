import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import pl from './pl.json'
import {
    SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE,
    detectLanguage, readStoredLanguage, storeLanguage,
} from './language'

const initialLanguage = detectLanguage(
    readStoredLanguage(),
    typeof navigator !== 'undefined' ? navigator.languages : [],
)

i18n
    .use(initReactI18next)
    .init({
        resources:     { en: { translation: en }, pl: { translation: pl } },
        lng:           initialLanguage,
        fallbackLng:   DEFAULT_LANGUAGE,
        supportedLngs: SUPPORTED_LANGUAGES,
        // React already escapes rendered strings.
        interpolation: { escapeValue: false },
        returnNull:    false,
    })

function syncDocument(lang) {
    if (typeof document !== 'undefined') document.documentElement.lang = lang
}

syncDocument(i18n.language)

i18n.on('languageChanged', (lang) => {
    storeLanguage(lang)
    syncDocument(lang)
})

export default i18n
