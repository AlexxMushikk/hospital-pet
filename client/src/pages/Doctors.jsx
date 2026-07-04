import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getDoctors, getDoctorPriceRange } from '../api/index'
import DoctorCard from '../components/DoctorCard'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'
import { useModal } from '../hooks/useModal'
import { Range, getTrackBackground } from 'react-range'

function RadioOption({ name, value, label, filterKey, filters, onFilterChange }) {
    return (
        <label className="radio-container">
            <span>{label}</span>
            <input
                type="radio"
                name={name}
                value={value}
                checked={filters[filterKey] === value}
                onChange={() => onFilterChange(filterKey, value)}
            />
            <span className="checkmark"></span>
        </label>
    )
}

function PriceRangeSlider({ min = 0, max = 1000, currentMin, currentMax, onChange }) {
    const [values, setValues] = useState([currentMin, currentMax])

    const prevMin = useRef(currentMin)
    const prevMax = useRef(currentMax)

    if (prevMin.current !== currentMin) { prevMin.current = currentMin; setValues(v => [currentMin, v[1]]) }
    if (prevMax.current !== currentMax) { prevMax.current = currentMax; setValues(v => [v[0], currentMax]) }

    return (
        <div>
            <div className="price-slider-labels">
                <span>{values[0]} PLN</span>
                <span>{values[1]} PLN</span>
            </div>
            <Range
                step={1}
                min={min}
                max={max}
                values={values}
                onChange={setValues}
                onFinalChange={([newMin, newMax]) => onChange(newMin, newMax)}
                renderTrack={({ props, children }) => (
                    <div
                        {...props}
                        style={{
                            ...props.style,
                            height: '4px',
                            width: '100%',
                            borderRadius: '2px',
                            background: getTrackBackground({
                                values,
                                colors: ['#e5e7eb', '#dc2626', '#e5e7eb'],
                                min,
                                max,
                            }),
                        }}
                    >
                        {children}
                    </div>
                )}
                renderThumb={({ props }) => (
                    <div
                        {...props}
                        key={props.key}
                        style={{
                            ...props.style,
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            border: '2px solid #dc2626',
                            outline: 'none',
                        }}
                    />
                )}
            />
        </div>
    )
}

export default function Doctors() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const doctorId = user?.doctor_id ?? null
    const { modal, showModal, closeModal } = useModal()

    const [searchParams, setSearchParams] = useSearchParams()

    // Диапазон цен из БД — загружается один раз при mount
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })

    const filters = {
        name:           searchParams.get('name')           || '',
        specialization: searchParams.get('specialization') || '',
        gender:         searchParams.get('gender')         || '',
        experience:     searchParams.get('experience')     || '0',
        sort:           searchParams.get('sort')           || 'name_asc',
        minPrice:       searchParams.get('minPrice')       || null,
        maxPrice:       searchParams.get('maxPrice')       || null,
    }
    const currentPage = parseInt(searchParams.get('page') || '1', 10)

    const [doctors,    setDoctors]    = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading,    setLoading]    = useState(true)
    const [error,      setError]      = useState('')

    // Загружаем реальный диапазон цен один раз —
    // нужен чтобы задать границы ползунка
    useEffect(() => {
        getDoctorPriceRange()
            .then(res => {
                console.log('priceRange:', res.data)
                setPriceRange(res.data)
            })
            .catch(err => console.error('priceRange error:', err))
    }, [])

    const handleFilterChange = (field, value) => {
        const next = new URLSearchParams(searchParams.toString())
        if (value) next.set(field, value)
        else next.delete(field)
        next.set('page', '1')
        setSearchParams(next)
    }

    // Применяем диапазон цен в URL когда пользователь отпустил ползунок
    const handlePriceChange = (min, max) => {
        const next = new URLSearchParams(searchParams.toString())
        // Если выбран весь диапазон — убираем параметры из URL
        if (min === priceRange.min && max === priceRange.max) {
            next.delete('minPrice')
            next.delete('maxPrice')
        } else {
            next.set('minPrice', String(min))
            next.set('maxPrice', String(max))
        }
        next.set('page', '1')
        setSearchParams(next)
    }

    const handlePageChange = (page) => {
        const next = new URLSearchParams(searchParams.toString())
        next.set('page', String(page))
        setSearchParams(next)
        window.scrollTo(0, 0)
    }

    useEffect(() => {
        let cancelled = false

        const currentPage = parseInt(searchParams.get('page') || '1', 10)
        const filters = {
            name:           searchParams.get('name')           || '',
            specialization: searchParams.get('specialization') || '',
            gender:         searchParams.get('gender')         || '',
            experience:     searchParams.get('experience')     || '0',
            sort:           searchParams.get('sort')           || 'name_asc',
            minPrice:       searchParams.get('minPrice'),
            maxPrice:       searchParams.get('maxPrice'),
        }

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const params = {
                    page:  currentPage,
                    limit: 6,
                    sort:  filters.sort,
                    ...(filters.name           && { name: filters.name }),
                    ...(filters.specialization && { specialization: filters.specialization }),
                    ...(filters.gender         && { gender: filters.gender }),
                    ...(filters.experience !== '0' && { minExperience: filters.experience }),
                    ...(filters.minPrice && { minPrice: filters.minPrice }),
                    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
                }

                const response = await getDoctors(params)
                let { doctors: list, totalPages: pages } = response.data

                if (doctorId) list = list.filter(doc => doc.id !== doctorId)

                if (!cancelled) {
                    setDoctors(list)
                    setTotalPages(pages)
                }
            } catch {
                if (!cancelled) setError('Не удалось загрузить список врачей')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        // void подавляет предупреждение "Promise ignored" —
        // useEffect не может быть async, поэтому вызываем load() без await
        void load()
        return () => { cancelled = true }
    }, [searchParams, doctorId])

    const handleBookClick = (doctor) => {
        if (!user) {
            showModal(
                'Требуется авторизация',
                'Войдите в систему чтобы записаться к врачу.',
                () => navigate('/login')
            )
        } else {
            navigate(`/booking?doctorId=${doctor.id}&name=${encodeURIComponent(doctor.name)}`)
        }
    }

    const radioProps = { filters, onFilterChange: handleFilterChange }

    return (
        <main className="container">
            <section className="page-title" style={{ textAlign: 'left', paddingBottom: '20px' }}>
                <h2 style={{ fontWeight: 800 }}>Наши специалисты</h2>
                <p>Найдите нужного врача для вашего случая.</p>
            </section>

            <div className="doctors-layout">

                <aside className="doctors-sidebar">

                    <div className="sidebar-block">
                        <label className="filter-title">🔍 Поиск по имени</label>
                        <input
                            type="text"
                            placeholder="Например: Dr. House..."
                            className="sidebar-search-input"
                            value={filters.name}
                            onChange={e => handleFilterChange('name', e.target.value)}
                        />
                    </div>

                    <div className="sidebar-block">
                        <label className="filter-title">Сортировка</label>
                        <select
                            className="sidebar-search-input"
                            value={filters.sort}
                            onChange={e => handleFilterChange('sort', e.target.value)}
                        >
                            <option value="name_asc">По имени (А–Я)</option>
                            <option value="price_asc">Цена ↑</option>
                            <option value="price_desc">Цена ↓</option>
                            <option value="exp_desc">Опыт ↓</option>
                        </select>
                    </div>

                    {/* Ползунок цены — показываем только когда диапазон загружен */}
                    {priceRange.max > priceRange.min && (
                        <div className="sidebar-block">
                            <span className="filter-title">Цена визита (PLN)</span>
                            <PriceRangeSlider
                                key={`${filters.minPrice}-${filters.maxPrice}`}
                                min={priceRange.min}
                                max={priceRange.max}
                                currentMin={filters.minPrice ? parseInt(filters.minPrice, 10) : priceRange.min}
                                currentMax={filters.maxPrice ? parseInt(filters.maxPrice, 10) : priceRange.max}
                                onChange={handlePriceChange}
                            />
                        </div>
                    )}

                    <div className="sidebar-block">
                        <span className="filter-title">Специализация</span>
                        <div className="filter-radio-group">
                            <RadioOption name="filterSpecialty" value=""                    label="Все специализации" filterKey="specialization" {...radioProps} />
                            <RadioOption name="filterSpecialty" value="Cardiology"          label="Кардиология"        filterKey="specialization" {...radioProps} />
                            <RadioOption name="filterSpecialty" value="Pediatrics"          label="Педиатрия"          filterKey="specialization" {...radioProps} />
                            <RadioOption name="filterSpecialty" value="Surgery"             label="Хирургия"           filterKey="specialization" {...radioProps} />
                            <RadioOption name="filterSpecialty" value="Neurology"           label="Неврология"         filterKey="specialization" {...radioProps} />
                            <RadioOption name="filterSpecialty" value="Diagnostics"         label="Диагностика"        filterKey="specialization" {...radioProps} />
                            <RadioOption name="filterSpecialty" value="General Examination" label="Общий осмотр"       filterKey="specialization" {...radioProps} />
                        </div>
                    </div>

                    <div className="sidebar-block">
                        <span className="filter-title">Пол</span>
                        <div className="filter-radio-group">
                            <RadioOption name="filterGender" value=""       label="Любой"   filterKey="gender" {...radioProps} />
                            <RadioOption name="filterGender" value="Male"   label="Мужской" filterKey="gender" {...radioProps} />
                            <RadioOption name="filterGender" value="Female" label="Женский" filterKey="gender" {...radioProps} />
                        </div>
                    </div>

                    <div className="sidebar-block">
                        <span className="filter-title">Опыт работы</span>
                        <div className="filter-radio-group">
                            <RadioOption name="filterExperience" value="0"  label="Любой опыт" filterKey="experience" {...radioProps} />
                            <RadioOption name="filterExperience" value="5"  label="5+ лет"      filterKey="experience" {...radioProps} />
                            <RadioOption name="filterExperience" value="10" label="10+ лет"     filterKey="experience" {...radioProps} />
                        </div>
                    </div>

                </aside>

                <section className="doctors-main-content">

                    {loading && (
                        <div className="doctors-grid">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="doctor-card">
                                    <div className="doctor-photo-box skeleton" />
                                    <div className="doctor-info" style={{ flex: 1 }}>
                                        <div className="skeleton skeleton-text" />
                                        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p style={{ color: '#dc2626', textAlign: 'center', padding: '40px' }}>{error}</p>
                    )}

                    {!loading && !error && doctors.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                            Специалисты не найдены. Попробуйте изменить фильтры.
                        </div>
                    )}

                    {!loading && !error && doctors.length > 0 && (
                        <>
                            <div className="doctors-grid">
                                {doctors.map(doctor => (
                                    <DoctorCard
                                        key={doctor.id}
                                        doctor={doctor}
                                        onBookClick={handleBookClick}
                                    />
                                ))}
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    )}

                </section>
            </div>

            <Modal
                isOpen={modal.isOpen}
                title={modal.title}
                message={modal.message}
                onConfirm={modal.onConfirm}
                onClose={closeModal}
            />
        </main>
    )
}
