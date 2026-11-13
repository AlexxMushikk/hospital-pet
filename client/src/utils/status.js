import i18n from '../i18n'

// Appointment status badges. A new status needs a class here and a label
// under "status" in every i18n catalog.

const STATUS_CLASSES = {
    Scheduled: 'status-badge status-scheduled',
    Completed: 'status-badge status-completed',
    Cancelled: 'status-badge status-cancelled',
}

export const statusLabel = (status) =>
    i18n.t(`status.${status}`, { defaultValue: status })

export const statusClass = (status) =>
    STATUS_CLASSES[status] || 'status-badge status-scheduled'
