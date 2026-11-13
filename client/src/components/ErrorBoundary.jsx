import { Component } from 'react'
import { logger } from '../utils/logger'
import i18n from '../i18n'

export default class ErrorBoundary extends Component {

    state = { hasError: false, error: null }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        logger.error('ErrorBoundary', error, info.componentStack)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            // A class component cannot use hooks; the boundary only renders after a crash,
            // so reading the current language at that moment is enough.
            const t = i18n.t.bind(i18n)
            return (
                <div className="auth-container">
                    <div className="auth-card error-boundary-card">
                        <h2 className="error-boundary__icon">💥</h2>
                        <h3>{t('errorBoundary.title')}</h3>
                        <p className="error-boundary__text">
                            {t('errorBoundary.text')}
                        </p>
                        <div className="error-boundary__actions">
                            <button className="btn btn-solid" onClick={this.handleReset}>
                                {t('errorBoundary.retry')}
                            </button>
                            <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
                                {t('common.goHome')}
                            </button>
                        </div>
                        {import.meta.env.DEV && (
                            <pre className="error-boundary__trace">
                                {this.state.error?.toString()}
                            </pre>
                        )}
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
