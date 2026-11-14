import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getDoctors, getDoctorPriceRange } from '../../api/index'
import DoctorCard from '../../components/doctor-card/DoctorCard'
import Pagination from '../../components/pagination/Pagination'
import Modal from '../../components/modal/Modal'
import { useModal } from '../../hooks/useModal'
import { Range, getTrackBackground } from 'react-range'
import { logger } from '../../utils/logger'
import { DOCTORS_PER_PAGE, SPECIALIZATIONS } from '../../constants'
import { Search } from 'lucide-react'
import '../../styles/forms.css'
import '../../styles/layout.css'
import '../../styles/cards.css'
import '../../styles/skeleton.css'
import './Doctors.css'

const MIN_PRICE_GAP = 50

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

function readQuery(searchParams) {
    return {
        page: parseInt(searchParams.get('page') || '1', 10),
        filters: {
            name:           searchParams.get('name')           || '',
            specialization: searchParams.get('specialization') || '',
            gender:         searchParams.get('gender')         || '',
            experience:     searchParams.get('experience')     || '0',
            sort:           searchParams.get('sort')           || 'name_asc',
            minPrice:       searchParams.get('minPrice')       || null,
            maxPrice:       searchParams.get('maxPrice')       || null,
        },
    }
}

function PriceRangeSlider({ min = 0, max = 1000, currentMin, currentMax, onChange }) {

    const [values, setValues] = useState([currentMin, currentMax])

    const gap = Math.min(MIN_PRICE_GAP, max - min)

    const clampGap = (next) => {
        let [lo, hi] = next
        if (hi - lo < gap) {
            if (lo !== values[0]) lo = hi - gap
            else                  hi = lo + gap
        }
        return [lo, hi]
    }

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
                onChange={next => setValues(clampGap(next))}
                onFinalChange={next => { const [lo, hi] = clampGap(next); onChange(lo, hi) }}
                renderTrack={({ props, children }) => (
                    <div
                        {...props}
                        className="price-track"
                        style={{
                            ...props.style,
                            background: getTrackBackground({
                                values,
                                colors: ['var(--color-border)', 'var(--color-primary)', 'var(--color-border)'],
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
                        className="price-thumb"
                    />
                )}
            />
        </div>
    )
}

export default function Doctors() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { t } = useTranslation()
    const doctorId = user?.doctor_id ?? null
    const { modal, showModal, closeModal } = useModal()

    const [searchParams, setSearchParams] = useSearchParams()

    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })

    const { page: currentPage, filters } = readQuery(searchParams)

    const [doctors,    setDoctors]    = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [loading,    setLoading]    = useState(true)
    const [error,      setError]      = useState('')

    useEffect(() => {
        getDoctorPriceRange()
            .then(res => {
                setPriceRange(res.data)
            })
            .catch(err => logger.error('Doctors.priceRange', err))
    }, [])

    const handleFilterChange = (field, value) => {
        const next = new URLSearchParams(searchParams.toString())
        if (value) next.set(field, value)
        else next.delete(field)
        next.set('page', '1')
        setSearchParams(next)
    }

    const handlePriceChange = (min, max) => {
        const next = new URLSearchParams(searchParams.toString())
        // Full range selected: drop the params so the URL stays clean
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

        const { page: currentPage, filters } = readQuery(searchParams)

        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const params = {
                    page:  currentPage,
                    limit: DOCTORS_PER_PAGE,
                    sort:  filters.sort,
                    ...(filters.name           && { name: filters.name }),
                    ...(filters.specialization && { specialization: filters.specialization }),
                    ...(filters.gender         && { gender: filters.gender }),
                    ...(filters.experience !== '0' && { minExperience: filters.experience }),
                    ...(filters.minPrice && { minPrice: filters.minPrice }),
                    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
                    ...(doctorId && { excludeDoctorId: doctorId }),
                }

                const response = await getDoctors(params)
                let { doctors: list, totalPages: pages } = response.data

                if (!cancelled) {
                    setDoctors(list)
                    setTotalPages(pages)
                }
            } catch {
                if (!cancelled) setError('doctors.loadError')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void load()
        return () => { cancelled = true }
    }, [searchParams, doctorId])

    const handleBookClick = (doctor) => {
        if (!user) {
            showModal(
                t('auth.authRequiredTitle'),
                t('auth.authRequiredText'),
                () => navigate('/login')
            )
        } else {
            navigate(`/booking?doctorId=${doctor.id}&name=${encodeURIComponent(doctor.name)}`)
        }
    }

    const radioProps = { filters, onFilterChange: handleFilterChange }

    return (
        <main className="container">
            <section className="page-title page-title--left">
                <h2>{t('doctors.title')}</h2>
                <p>{t('doctors.subtitle')}</p>
            </section>

            <div className="doctors-layout">

                <aside className="doctors-sidebar">

                    <div className="sidebar-block">
                        <label className="filter-title filter-title--icon">
                            <Search size={16} aria-hidden="true" />
                            {t('doctors.searchLabel')}
                        </label>
                        <input
                            type="text"
                            placeholder={t('doctors.searchPlaceholder')}
                            className="sidebar-search-input"
                            value={filters.name}
                            onChange={e => handleFilterChange('name', e.target.value)}
                        />
                    </div>

                    <div className="sidebar-block">
                        <label className="filter-title">{t('doctors.sortLabel')}</label>
                        <select
                            className="sidebar-search-input"
                            value={filters.sort}
                            onChange={e => handleFilterChange('sort', e.target.value)}
                        >
                            <option value="name_asc">{t('doctors.sortNameAsc')}</option>
                            <option value="price_asc">{t('doctors.sortPriceAsc')}</option>
                            <option value="price_desc">{t('doctors.sortPriceDesc')}</option>
                            <option value="exp_desc">{t('doctors.sortExpDesc')}</option>
                        </select>
                    </div>

                    {priceRange.max > priceRange.min && (
                        <div className="sidebar-block">
                            <span className="filter-title">{t('doctors.priceFilter')}</span>
                            <PriceRangeSlider
                                key={`${priceRange.min}-${priceRange.max}-${filters.minPrice}-${filters.maxPrice}`}
                                min={priceRange.min}
                                max={priceRange.max}
                                currentMin={filters.minPrice ? parseInt(filters.minPrice, 10) : priceRange.min}
                                currentMax={filters.maxPrice ? parseInt(filters.maxPrice, 10) : priceRange.max}
                                onChange={handlePriceChange}
                            />
                        </div>
                    )}

                    <div className="sidebar-block">
                        <span className="filter-title">{t('common.specialization')}</span>
                        <div className="filter-radio-group">
                            <RadioOption name="filterSpecialty" value="" label={t('doctors.allSpecializations')} filterKey="specialization" {...radioProps} />
                            {SPECIALIZATIONS.map(spec => (
                                <RadioOption
                                    key={spec.value}
                                    name="filterSpecialty"
                                    value={spec.value}
                                    label={t(`spec.${spec.value}.label`)}
                                    filterKey="specialization"
                                    {...radioProps}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="sidebar-block">
                        <span className="filter-title">{t('common.gender')}</span>
                        <div className="filter-radio-group">
                            <RadioOption name="filterGender" value=""       label={t('gender.any')} filterKey="gender" {...radioProps} />
                            <RadioOption name="filterGender" value="Male"   label={t('gender.Male')} filterKey="gender" {...radioProps} />
                            <RadioOption name="filterGender" value="Female" label={t('gender.Female')} filterKey="gender" {...radioProps} />
                        </div>
                    </div>

                    <div className="sidebar-block">
                        <span className="filter-title">{t('doctors.experienceFilter')}</span>
                        <div className="filter-radio-group">
                            <RadioOption name="filterExperience" value="0"  label={t('doctors.experienceAny')} filterKey="experience" {...radioProps} />
                            <RadioOption name="filterExperience" value="5"  label={t('doctors.experience5')} filterKey="experience" {...radioProps} />
                            <RadioOption name="filterExperience" value="10" label={t('doctors.experience10')} filterKey="experience" {...radioProps} />
                        </div>
                    </div>

                </aside>

                <section className="doctors-main-content">

                    {loading && (
                        <div className="doctors-grid">
                            {Array.from({ length: DOCTORS_PER_PAGE }).map((_, i) => (
                                <div key={i} className="doctor-card">
                                    <div className="doctor-photo-box skeleton" />
                                    <div className="doctor-info skeleton-info">
                                        <div className="skeleton skeleton-text" />
                                        <div className="skeleton skeleton-text skeleton-text--sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <p className="text-error">{t(error)}</p>
                    )}

                    {!loading && !error && doctors.length === 0 && (
                        <div className="empty-state">
                            {t('doctors.empty')}
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
