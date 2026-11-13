import { useTranslation } from 'react-i18next'

import { SUPPORTED_LANGUAGES } from '../../i18n/language'
import './StableText.css'

// A translated label that is always as wide as its longest translation, so switching
// the language does not resize the button or link around it and move its neighbours.
// The other translations sit in the same grid cell, invisible and hidden from screen readers.
export default function StableText({ k, options }) {
    const { t, i18n } = useTranslation()
    const current = i18n.resolvedLanguage

    return (
        <span className="stable-text">
            <span>{t(k, options)}</span>
            {SUPPORTED_LANGUAGES.filter(lang => lang !== current).map(lang => (
                <span key={lang} className="stable-text__ghost" aria-hidden="true">
                    {t(k, { ...options, lng: lang })}
                </span>
            ))}
        </span>
    )
}
