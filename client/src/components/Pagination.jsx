// Переиспользуемый пагинатор.
// Принимает currentPage, totalPages, onPageChange — ничего лишнего.
// Будет использоваться на Doctors, Admin Database и тд.

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null

    return (
        <div className="pagination-container" style={{ background: 'transparent', border: 'none', marginTop: '30px' }}>
            {/* Кнопка "Назад" */}
            <button
                className="btn btn-outline btn-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                ←
            </button>

            {/* Номера страниц */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                    key={page}
                    className={`btn btn-sm ${page === currentPage ? 'btn-solid' : 'btn-outline'}`}
                    onClick={() => onPageChange(page)}
                    style={{ margin: '0 2px' }}
                >
                    {page}
                </button>
            ))}

            {/* Кнопка "Вперёд" */}
            <button
                className="btn btn-outline btn-sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                →
            </button>
        </div>
    )
}