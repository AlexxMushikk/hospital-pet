// Single source of truth for appointment statuses:
// a new status only needs to be added here.

const STATUS_LABELS = {
    Scheduled: 'Запланирован',
    Completed: 'Завершён',
    Cancelled: 'Отменён',
}

const STATUS_CLASSES = {
    Scheduled: 'status-badge status-scheduled',
    Completed: 'status-badge status-completed',
    Cancelled: 'status-badge status-cancelled',
}

export const statusLabel = (status) =>
    STATUS_LABELS[status] || status

export const statusClass = (status) =>
    STATUS_CLASSES[status] || 'status-badge status-scheduled'
