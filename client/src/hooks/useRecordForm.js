import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getAdminRecord, updateAdminRecord } from '../api/index'
import { apiErrorMessage } from '../utils/apiError'

export default function useRecordForm({ table, id, initialForm, mapRecord, buildPayload, validate }) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [record, setRecord] = useState(null)
    const [form, setForm] = useState(initialForm)

    useEffect(() => {
        getAdminRecord(table, id)
            .then(res => {
                setRecord(res.data)
                setForm(mapRecord(res.data))
            })
            .catch(err => setError(apiErrorMessage(err, 'adminRecords.loadError')))
            .finally(() => setLoading(false))
    }, [table, id, mapRecord])

    const onChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

    const setField = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (validate) {
            // Validators return a catalog key, the same codes the server uses.
            const key = validate(form)
            if (key) { setError(t(key)); return }
        }

        setSubmitting(true)
        try {
            await updateAdminRecord(table, id, buildPayload ? buildPayload(form) : form)
            navigate('/admin/database')
        } catch (err) {
            setError(apiErrorMessage(err, 'adminRecords.saveError'))
        } finally {
            setSubmitting(false)
        }
    }

    return { loading, submitting, error, form, record, onChange, setField, handleSubmit, setError }
}
