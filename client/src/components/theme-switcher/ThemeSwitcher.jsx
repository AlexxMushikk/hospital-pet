import { useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import { currentTheme, setTheme, subscribeTheme } from '../../theme/theme'
import { Sun, Moon } from 'lucide-react'
import './ThemeSwitcher.css'

export default function ThemeSwitcher() {
    const { t } = useTranslation()
    const theme = useSyncExternalStore(subscribeTheme, currentTheme)
    const next  = theme === 'dark' ? 'light' : 'dark'
    const label = next === 'dark' ? t('theme.switchToDark') : t('theme.switchToLight')

    return (
        <button
            type="button"
            className="theme-switcher"
            onClick={() => setTheme(next)}
            aria-label={label}
            title={label}
        >
            {theme === 'dark'
                ? <Sun size={18} aria-hidden="true" />
                : <Moon size={18} aria-hidden="true" />}
        </button>
    )
}
