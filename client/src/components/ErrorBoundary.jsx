import { Component } from 'react'
import { logger } from '../utils/logger'

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
            return (
                <div className="auth-container">
                    <div className="auth-card error-boundary-card">
                        <h2 className="error-boundary__icon">💥</h2>
                        <h3>Что-то пошло не так</h3>
                        <p className="error-boundary__text">
                            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
                        </p>
                        <div className="error-boundary__actions">
                            <button className="btn btn-solid" onClick={this.handleReset}>
                                Попробовать снова
                            </button>
                            <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
                                На главную
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
