import { useTranslation } from 'react-i18next'

export default function Footer() {
    const { t } = useTranslation()

    return (
        <footer className="main-footer">
            <div className="container">
                <p>{t('footer.rights')}</p>
            </div>
        </footer>
    )
}
