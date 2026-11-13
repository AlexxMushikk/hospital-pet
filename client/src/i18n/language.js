export const SUPPORTED_LANGUAGES = ['en', 'pl']
export const DEFAULT_LANGUAGE    = 'en'
export const LANGUAGE_STORAGE_KEY = 'hospital_lang'

const isSupported = (lang) => SUPPORTED_LANGUAGES.includes(lang)

// Picks the interface language: the one chosen earlier on this device, then the first
// supported language of the browser ('pl-PL' counts as 'pl'), then English.
export function detectLanguage(stored, browserLanguages = []) {
    if (isSupported(stored)) return stored

    for (const tag of browserLanguages) {
        const base = String(tag).toLowerCase().split('-')[0]
        if (isSupported(base)) return base
    }

    return DEFAULT_LANGUAGE
}

// localStorage can throw (private mode, blocked storage): the choice then lasts for the session only.
export function readStoredLanguage() {
    try {
        return localStorage.getItem(LANGUAGE_STORAGE_KEY)
    } catch {
        return null
    }
}

export function storeLanguage(lang) {
    try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang)
    } catch {
        // Nothing to do: the language still applies until the tab is closed.
    }
}
