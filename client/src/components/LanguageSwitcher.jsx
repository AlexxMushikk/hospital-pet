import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES } from '../i18n/language'

export default function LanguageSwitcher() {
    const { t, i18n } = useTranslation()

    return (
        <div className="view-switcher" role="group" aria-label={t('lang.switcherLabel')}>
            {SUPPORTED_LANGUAGES.map(lang => (
                <button
                    key={lang}
                    type="button"
                    className={`view-btn ${i18n.resolvedLanguage === lang ? 'active' : ''}`}
                    aria-pressed={i18n.resolvedLanguage === lang}
                    onClick={() => i18n.changeLanguage(lang)}
                >
                    {t(`lang.${lang}`)}
                </button>
            ))}
        </div>
    )
}
