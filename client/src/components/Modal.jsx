export default function Modal({ isOpen, title, message, onConfirm, onClose, confirmLabel = 'OK', cancelLabel, variant }) {

    const handleConfirm = () => {
        onClose()
        if (onConfirm) onConfirm()
    }

    if (!isOpen) return null

    const confirmClass = `btn w-full ${variant === 'danger' ? 'btn-solid' : 'btn-outline'}`

    return (
        <div className="modal-overlay active" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3>{title}</h3>
                <p className="modal-message">{message}</p>
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
