const SIBLINGS = 1

function getPageItems(current, total) {
    const range = (start, end) =>
        Array.from({ length: end - start + 1 }, (_, i) => start + i)

    if (total <= SIBLINGS * 2 + 5) return range(1, total)

    const leftSibling  = Math.max(current - SIBLINGS, 1)
    const rightSibling = Math.min(current + SIBLINGS, total)

    const showLeftDots  = leftSibling > 2
    const showRightDots = rightSibling < total - 1

    const edgeCount = 3 + SIBLINGS * 2

    if (!showLeftDots && showRightDots) {
        return [...range(1, edgeCount), 'right-ellipsis', total]
    }
    if (showLeftDots && !showRightDots) {
        return [1, 'left-ellipsis', ...range(total - edgeCount + 1, total)]
    }
    return [1, 'left-ellipsis', ...range(leftSibling, rightSibling), 'right-ellipsis', total]
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null

    return (
        <div className="pagination-container" style={{ background: 'transparent', border: 'none', marginTop: '30px' }}>
            <button
                className="btn btn-outline btn-sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
            >
                ←
            </button>

            {getPageItems(currentPage, totalPages).map(item =>
                typeof item === 'string' ? (
                    <span key={item} className="pagination-ellipsis" style={{ padding: '0 8px', color: '#9ca3af' }}>…</span>
                ) : (
                    <button
                        key={item}
                        className={`btn btn-sm ${item === currentPage ? 'btn-solid' : 'btn-outline'}`}
                        onClick={() => onPageChange(item)}
                        style={{ margin: '0 2px' }}
                    >
                        {item}
                    </button>
                )
            )}

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
