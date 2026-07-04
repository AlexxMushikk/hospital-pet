import { Component } from 'react'

export default class ErrorBoundary extends Component {

    state = { hasError: false, error: null }

    // Вызывается когда дочерний компонент бросает ошибку.
    // Возвращает объект который мерджится в state —
    // аналог setState но для фазы рендера.
    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    // Вызывается после того как ошибка поймана.
    // Здесь можно логировать в Sentry, LogRocket и т.д.
    // info.componentStack — стек компонентов где произошла ошибка.
    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info.componentStack)
    }

    // Сбрасываем состояние ошибки — пользователь может попробовать снова
    handleReset = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="auth-container">
                    <div className="auth-card" style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '3rem', margin: '0 0 10px' }}>💥</h2>
                        <h3>Что-то пошло не так</h3>
                        <p style={{ color: '#6b7280', margin: '10px 0 25px' }}>
                            Произошла непредвиденная ошибка. Попробуйте обновить страницу.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button className="btn btn-solid" onClick={this.handleReset}>
                                Попробовать снова
                            </button>
                            <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
                                На главную
                            </button>
                        </div>
                        {/* В dev-режиме показываем текст ошибки — в продакшене убирать */}
                        {import.meta.env.DEV && (
                            <pre style={{ marginTop: '20px', textAlign: 'left', fontSize: '11px', color: '#dc2626', background: '#fef2f2', padding: '10px', borderRadius: '6px', overflow: 'auto' }}>
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
