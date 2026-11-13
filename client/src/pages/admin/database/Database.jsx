import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getAdminList, deleteAdminRecord } from '../../../api/index'
import Pagination from '../../../components/pagination/Pagination'
import Modal from '../../../components/modal/Modal'
import { useModal } from '../../../hooks/useModal'
import { apiErrorMessage } from '../../../utils/apiError'
import '../../../styles/buttons.css'
import '../../../styles/forms.css'
import '../../../styles/layout.css'
import './Database.css'

const TABLES = ['doctors', 'patients', 'appointments']
const TABLE_LABELS = {
    doctors:      'adminDatabase.tableDoctors',
    patients:     'adminDatabase.tablePatients',
    appointments: 'adminDatabase.tableAppointments',
}
const LIMIT = 10
const SEARCH_DEBOUNCE_MS = 300


export default function AdminDatabase() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { modal, showModal, closeModal } = useModal()

    const [table,   setTable]   = useState('doctors')
    const [data,    setData]    = useState([])
    const [total,   setTotal]   = useState(0)
    const [page,    setPage]    = useState(1)
    const [search,  setSearch]  = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetchKey, setFetchKey] = useState(0)

    const totalPages = Math.ceil(total / LIMIT)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(timer)
    }, [search])

    useEffect(() => {
        let cancelled = false

        const loadData = async () => {
            setLoading(true)
            try {
                const params = { page, limit: LIMIT }
                if (debouncedSearch && table !== 'appointments') {
                    params.search = debouncedSearch
                }
                const res = await getAdminList(table, params)
                if (!cancelled) {
                    setData(res.data.data)
                    setTotal(res.data.totalCount)
                }
            } catch {
                if (!cancelled) {
                    setData([])
                    setTotal(0)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadData()
        return () => { cancelled = true }
    }, [table, page, fetchKey, debouncedSearch])

    const handleTableSwitch = (name) => {
        setTable(name)
        setSearch('')
        setPage(1)
    }

    const handleSearchChange = (e) => {
        setSearch(e.target.value)
        setPage(1)
    }

    const handleDelete = (id) => {
        showModal(
            t('adminDatabase.deleteConfirmTitle'),
            t('adminDatabase.deleteConfirmText', { id }),
            async () => {
                try {
                    await deleteAdminRecord(table, id)

                    if (page === 1) {
                        setFetchKey(k => k + 1)
                    } else {
                        setPage(1)
                    }
                } catch (err) {
                    showModal(t('common.error'), apiErrorMessage(err, 'adminDatabase.deleteError'))
                }
            },
            t('common.cancel'),
            'danger'
        )
    }

    const renderRow = (item) => {
        if (table === 'doctors') return (
            <><td>{item.id}</td><td><strong>{item.name}</strong></td><td>{t(`spec.${item.specialization}.label`, { defaultValue: item.specialization })}</td></>
        )
        if (table === 'patients') return (
            <><td>{item.id}</td><td><strong>{item.full_name}</strong></td><td>{item.email}</td></>
        )
        return (
            <><td>{item.id}</td><td>{item.appointment_date}</td><td>{item.patient_name}</td><td>{item.doctor_name}</td></>
        )
    }

    const renderHead = () => {
        if (table === 'doctors') return (
            <tr><th>{t('common.id')}</th><th>{t('common.fullName')}</th><th>{t('common.specialization')}</th><th>{t('common.actions')}</th></tr>
        )
        if (table === 'patients') return (
            <tr><th>{t('common.id')}</th><th>{t('adminDatabase.patientName')}</th><th>{t('common.email')}</th><th>{t('common.actions')}</th></tr>
        )
        return (
            <tr><th>{t('common.id')}</th><th>{t('common.date')}</th><th>{t('common.patient')}</th><th>{t('common.doctor')}</th><th>{t('common.actions')}</th></tr>
        )
    }

    const searchDisabled = table === 'appointments'
    const colSpan = table === 'appointments' ? 5 : 4

    return (
        <main className="container admin-section">

            <section className="page-title page-title--row">
                <div>
                    <h2>{t('adminDatabase.title')}</h2>
                    <p>{t('adminDatabase.subtitle')}</p>
                </div>
                {table === 'doctors' && (
                    <button
                        className="btn btn-solid"
                        onClick={() => navigate('/admin/create-doctor')}
                    >
                        {t('adminDatabase.createDoctor')}
                    </button>
                )}
            </section>

            <div className="view-switcher view-switcher--center">
                {TABLES.map(name => (
                    <button
                        key={name}
                        className={`view-btn ${table === name ? 'active' : ''}`}
                        onClick={() => handleTableSwitch(name)}
                    >
                        {t(TABLE_LABELS[name])}
                    </button>
                ))}
            </div>

            <div className="sidebar-block search-block">
                <input
                    type="text"
                    placeholder={searchDisabled ? t('adminDatabase.searchDisabled') : t('adminDatabase.searchPlaceholder')}
                    className="sidebar-search-input"
                    value={search}
                    onChange={handleSearchChange}
                    disabled={searchDisabled}
                />
            </div>

            <div className="info-section">
                <div className="table-scroll">
                    <table className="admin-table">
                        <thead>{renderHead()}</thead>
                        <tbody>
                        {loading && (
                            <tr><td colSpan={colSpan} className="text-center">{t('common.loading')}</td></tr>
                        )}
                        {!loading && data.length === 0 && (
                            <tr><td colSpan={colSpan} className="text-center">{t('adminDatabase.notFound')}</td></tr>
                        )}
                        {!loading && data.map(item => (
                            <tr key={item.id}>
                                {renderRow(item)}
                                <td>
                                    <button
                                        className="btn btn-solid btn-sm"
                                        onClick={() => navigate(`/admin/records/${table}/${item.id}`)}
                                    >
                                        {t('common.edit')}
                                    </button>
                                    {' '}
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        {t('common.delete')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={p => setPage(p)}
                />
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
                cancelLabel={modal.cancelLabel}
                variant={modal.variant}
            />
        </main>
    )
}
