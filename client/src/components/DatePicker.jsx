import { useState, useRef, useEffect } from 'react'

const pad       = (n) => String(n).padStart(2, '0')
const toYMD     = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromYMD   = (s) => {
    if (!s) return null
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, m - 1, d)
}
const dayStart  = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay   = (a, b) => !!a && !!b && toYMD(a) === toYMD(b)
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1)

const mondayIdx = (d) => (d.getDay() + 6) % 7

const WEEK_ANCHOR = [2024, 0, 1]

export default function DatePicker({
                                       value,
                                       onChange,
                                       minDate,
                                       maxDate,
                                       locale = 'ru',
                                       placeholder = 'Выберите дату',
                                       id,
                                       className = '',
                                   }) {
    const [open, setOpen]           = useState(false)
    const [viewMonth, setViewMonth] = useState(() => fromYMD(value) || new Date())

    const rootRef    = useRef(null)
    const triggerRef = useRef(null)

    const selected = fromYMD(value)
    const min      = fromYMD(minDate)
    const max      = fromYMD(maxDate)
    const today    = new Date()

    useEffect(() => {
        if (!open) return

        const onDown = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
        }
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false)
                triggerRef.current?.focus()
            }
        }

        document.addEventListener('mousedown', onDown)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onDown)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    const openPicker = () => {
        setViewMonth(fromYMD(value) || new Date())
        setOpen(true)
    }

    const monthFmt   = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    const triggerFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' })
    const dayLabelFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' })

    const weekdays = Array.from({ length: 7 }, (_, i) =>
        weekdayFmt.format(new Date(WEEK_ANCHOR[0], WEEK_ANCHOR[1], WEEK_ANCHOR[2] + i))
    )

    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const gridStart = new Date(first)
    gridStart.setDate(first.getDate() - mondayIdx(first))
    const cells = Array.from({ length: 42 }, (_, i) =>
        new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    )

    const isDisabled = (d) => {
        const day = dayStart(d)
        if (min && day < dayStart(min)) return true
        if (max && day > dayStart(max)) return true
        return false
    }

    const pick = (d) => {
        if (isDisabled(d)) return
        onChange(toYMD(d))
        setOpen(false)
        triggerRef.current?.focus()
    }

    const goToday = () => {
        setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
        if (!isDisabled(today)) pick(today)
    }

    return (
        <div className={['datepicker', className].filter(Boolean).join(' ')} ref={rootRef}>
            <button
                type="button"
                id={id}
                ref={triggerRef}
                className="datepicker-trigger"
                onClick={() => (open ? setOpen(false) : openPicker())}
                aria-haspopup="dialog"
                aria-expanded={open}
            >
                <span className={selected ? undefined : 'datepicker-placeholder'}>
                    {selected ? triggerFmt.format(selected) : placeholder}
                </span>
                <svg className="datepicker-icon" width="18" height="18" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                </svg>
            </button>

            {open && (
                <div className="datepicker-popover" role="dialog" aria-label="Выбор даты">
                    <div className="datepicker-header">
                        <button type="button" className="datepicker-nav"
                                onClick={() => setViewMonth((m) => addMonths(m, -1))}
                                aria-label="Предыдущий месяц">‹</button>
                        <span className="datepicker-month">{monthFmt.format(viewMonth)}</span>
                        <button type="button" className="datepicker-nav"
                                onClick={() => setViewMonth((m) => addMonths(m, 1))}
                                aria-label="Следующий месяц">›</button>
                    </div>

                    <div className="datepicker-weekdays">
                        {weekdays.map((w, i) => (
                            <span key={i} className="datepicker-weekday">{w}</span>
                        ))}
                    </div>

                    <div className="datepicker-grid" role="grid">
                        {cells.map((d, i) => {
                            const outside  = d.getMonth() !== viewMonth.getMonth()
                            const disabled = isDisabled(d)
                            const isSel    = sameDay(d, selected)
                            const isToday  = sameDay(d, today)
                            const cls = [
                                'datepicker-day',
                                outside            ? 'is-outside'  : '',
                                disabled           ? 'is-disabled' : '',
                                isSel              ? 'is-selected' : '',
                                isToday && !isSel  ? 'is-today'    : '',
                            ].filter(Boolean).join(' ')

                            return (
                                <button
                                    key={i}
                                    type="button"
                                    className={cls}
                                    disabled={disabled}
                                    aria-selected={isSel}
                                    aria-label={dayLabelFmt.format(d)}
                                    onClick={() => pick(d)}
                                >
                                    {d.getDate()}
                                </button>
                            )
                        })}
                    </div>

                    <div className="datepicker-footer">
                        <button type="button" className="datepicker-link" onClick={goToday}>
                            Сегодня
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
