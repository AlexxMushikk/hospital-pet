// Light/dark theme. The theme lives on <html data-theme>, which tokens.css keys on.
// index.html applies the same rules in an inline script before the first paint;
// keep THEME_STORAGE_KEY in sync with it (a test checks this).

export const THEMES            = ['light', 'dark']
export const THEME_STORAGE_KEY = 'hospital_theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// A theme chosen on this device wins; otherwise the system preference decides.
export function resolveTheme(stored, systemPrefersDark) {
    if (THEMES.includes(stored)) return stored
    return systemPrefersDark ? 'dark' : 'light'
}

export function readStoredTheme() {
    try {
        return localStorage.getItem(THEME_STORAGE_KEY)
    } catch {
        return null
    }
}

function storeTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
        // Storage blocked: the theme still applies until the tab is closed.
    }
}

const systemPrefersDark = () =>
    typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches

const listeners = new Set()

export function currentTheme() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme) {
    if (document.documentElement.dataset.theme === theme) return
    document.documentElement.dataset.theme = theme
    listeners.forEach(listener => listener())
}

export function subscribeTheme(listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

// An explicit choice from the switcher: remembered and no longer follows the system.
export function setTheme(theme) {
    if (!THEMES.includes(theme)) return
    storeTheme(theme)
    applyTheme(theme)
}

// Applies the resolved theme and keeps following the system until the user picks one.
export function initTheme() {
    applyTheme(resolveTheme(readStoredTheme(), systemPrefersDark()))

    if (typeof matchMedia !== 'function') return () => {}
    const query = matchMedia(DARK_QUERY)
    const onChange = (e) => {
        if (!THEMES.includes(readStoredTheme())) applyTheme(e.matches ? 'dark' : 'light')
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
}
