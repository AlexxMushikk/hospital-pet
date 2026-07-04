import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminList, deleteAdminRecord } from '../../api/index'
import Pagination from '../../components/Pagination'
import Modal from '../../components/Modal'
import { useModal } from '../../hooks/useModal'

const TABLES = ['doctors', 'patients', 'appointments']
const TABLE_LABELS = { doctors: 'Врачи', patients: 'Пациенты', appointments: 'Записи' }
const LIMIT = 10
const SEARCH_DEBOUNCE_MS = 300


export default function AdminDatabase() {
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

    // Дебаунс ввода: не дёргаем сервер на каждую букву
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS)
        return () => clearTimeout(t)
    }, [search])

    // При смене поиска возвращаемся на первую страницу
    useEffect(() => {
        setPage(1)
    }, [debouncedSearch, table])

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

    const handleTableSwitch = (t) => {
        setTable(t)
        setSearch('')
    }

    const handleSearchChange = (e) => {
        setSearch(e.target.value)
    }

    const handleDelete = (id) => {
        showModal(
            'Подтверждение удаления',
            `Вы уверены что хотите удалить запись #${id}? Это действие необратимо.`,
            async () => {
                try {
                    await deleteAdminRecord(table, id)

                    if (page === 1) {
                        setFetchKey(k => k + 1)
                    } else {
                        setPage(1)
                    }
                } catch (err) {
                    showModal('Ошибка', err.response?.data?.error || 'Не удалось удалить запись.')
                }
            },
            'Отмена',
            'danger'
        )
    }

    const renderRow = (item) => {
        if (table === 'doctors') return (
            <><td>{item.id}</td><td><strong>{item.name}</strong></td><td>{item.specialization}</td></>
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
            <tr><th>ID</th><th>Имя</th><th>Специализация</th><th>Действия</th></tr>
        )
        if (table === 'patients') return (
            <tr><th>ID</th><th>Имя пациента</th><th>Email</th><th>Действия</th></tr>
        )
        return (
            <tr><th>ID</th><th>Дата</th><th>Пациент</th><th>Врач</th><th>Действия</th></tr>
        )
    }

    const searchDisabled = table === 'appointments'
    const colSpan = table === 'appointments' ? 5 : 4

    return (
        <main className="container admin-section">

            <section className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Управление базой данных</h2>
                    <p>Просмотр и редактирование всех записей системы.</p>
                </div>
                {table === 'doctors' && (
                    <button
                        className="btn btn-solid"
                        onClick={() => navigate('/admin/create-doctor')}
                    >
                        + Создать врача
                    </button>
                )}
            </section>

            <div className="view-switcher" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                {TABLES.map(t => (
                    <button
                        key={t}
                        className={`view-btn ${table === t ? 'active' : ''}`}
                        onClick={() => handleTableSwitch(t)}
                    >
                        {TABLE_LABELS[t]}
                    </button>
                ))}
            </div>

            <div className="sidebar-block" style={{ maxWidth: '400px', margin: '0 auto 30px', borderBottom: 'none' }}>
                <input
                    type="text"
                    placeholder={searchDisabled ? 'Поиск недоступен для записей' : 'Поиск по имени или email...'}
                    className="sidebar-search-input"
                    value={search}
                    onChange={handleSearchChange}
                    disabled={searchDisabled}
                />
            </div>

            <div className="info-section">
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>{renderHead()}</thead>
                        <tbody>
                        {loading && (
                            <tr><td colSpan={colSpan} style={{ textAlign: 'center' }}>Загрузка...</td></tr>
                        )}
                        {!loading && data.length === 0 && (
                            <tr><td colSpan={colSpan} style={{ textAlign: 'center' }}>Записи не найдены</td></tr>
                        )}
                        {!loading && data.map(item => (
                            <tr key={item.id}>
                                {renderRow(item)}
                                <td>
                                    <button
                                        className="btn btn-solid btn-sm"
                                        onClick={() => navigate(`/admin/records/${table}/${item.id}`)}
                                    >
                                        Изменить
                                    </button>
                                    {' '}
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleDelete(item.id)}
                                    >
                                        Удалить
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
