import { useState, useCallback } from 'react'

export function useModal() {
    const [modal, setModal] = useState({
        isOpen: false, title: '', message: '', onConfirm: null,
    })

    const showModal = useCallback((title, message, onConfirm = null, cancelLabel = null, variant = null) => {
        setModal({ isOpen: true, title, message, onConfirm, cancelLabel, variant })
    }, [])

    const closeModal = useCallback(() => {
        setModal(m => ({ ...m, isOpen: false }))
    }, [])

    return { modal, showModal, closeModal }
}
