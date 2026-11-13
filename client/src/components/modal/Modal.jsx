import { useEffect, useRef } from 'react'

export default function Modal({ isOpen, title, message, onConfirm, onClose, confirmLabel = 'OK', cancelLabel, variant }) {
    const contentRef = useRef(null)

    const handleConfirm = () => {
        onClose()
        if (onConfirm) onConfirm()
    }
    useEffect(() => {
        if (!isOpen) return

        const previouslyFocused = document.activeElement

        contentRef.current?.querySelector(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )?.focus()

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            previouslyFocused?.focus?.()
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const confirmClass = `btn w-full ${variant === 'danger' ? 'btn-solid' : 'btn-outline'}`

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div
                ref={contentRef}
                className="modal-content"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                aria-describedby="modal-desc"
            >
                <h3 id="modal-title">{title}</h3>
                <p id="modal-desc" className="modal-message">{message}</p>
                <div className="modal-actions">
                    {cancelLabel && (
                        <button className="btn btn-outline w-full" onClick={onClose}>
                            {cancelLabel}
                        </button>
                    )}
                    <button className={confirmClass} onClick={handleConfirm}>
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
