export function AuthField({ label, type = 'text', value, onChange, placeholder, minLength, required = true }) {
    return (
        <div className="form-group">
            <label>{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                required={required}
                minLength={minLength}
            />
        </div>
    )
}

export default function AuthForm({
                                     title,
                                     subtitle,
                                     error,
                                     loading,
                                     submitLabel,
                                     loadingLabel,
                                     onSubmit,
                                     children,
                                     footer,
                                 }) {
    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>{title}</h2>
                <p className="auth-subtitle">{subtitle}</p>

                <form onSubmit={onSubmit}>
                    {children}

                    {error && <div className="error-message">{error}</div>}

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-solid w-full"
                            disabled={loading}
                        >
                            {loading ? loadingLabel : submitLabel}
                        </button>
                    </div>
                </form>

                <div className="auth-footer">
                    {footer}
                </div>
            </div>
        </div>
    )
}
