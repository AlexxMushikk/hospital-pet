import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminRecord, updateAdminRecord } from '../api/index'

export default function useRecordForm({ table, id, initialForm, mapRecord, buildPayload, validate }) {
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
            .catch(err => setError(err.response?.data?.error || 'Не удалось загрузить запись'))
            .finally(() => setLoading(false))
    }, [table, id, mapRecord])

    const onChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (validate) {
            const msg = validate(form)
            if (msg) { setError(msg); return }
        }

        setSubmitting(true)
        try {
            await updateAdminRecord(table, id, buildPayload ? buildPayload(form) : form)
            navigate('/admin/database')
        } catch (err) {
            setError(err.response?.data?.error || 'Не удалось сохранить')
        } finally {
            setSubmitting(false)
        }
    }

    return { loading, submitting, error, form, record, onChange, handleSubmit, setError }
}
