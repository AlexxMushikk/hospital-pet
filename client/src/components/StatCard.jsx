export default function StatCard({ variant = 'large', accent, label, value }) {
    const classes = ['stat-card', `stat-card--${variant}`]
    if (accent) classes.push(`stat-card--${accent}`)

    return (
        <div className={classes.join(' ')}>
            <span className="stat-card__label">{label}</span>
            <span className="stat-card__value">{value}</span>
        </div>
    )
}
