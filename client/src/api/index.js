import axios from 'axios'

const api = axios.create({
    baseURL:         '/api',
    headers:         { 'Content-Type': 'application/json' },
    withCredentials: true,
})

let getToken    = () => null
let updateToken = () => {}

export function setTokenGetter(getter, updater) {
    getToken    = getter
    updateToken = updater
}

api.interceptors.request.use(config => {
    const token = getToken()
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
})

let isRefreshing = false
let waitingQueue  = []

const processQueue = (error, token = null) => {
    waitingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error)
        else resolve(token)
    })
    waitingQueue = []
}

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    waitingQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`
                    return api(originalRequest)
                })
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const { data } = await axios.post('/api/refresh', {}, { withCredentials: true })
                const newToken  = data.accessToken

                updateToken(newToken)

                processQueue(null, newToken)

                originalRequest.headers['Authorization'] = `Bearer ${newToken}`
                return api(originalRequest)

            } catch (refreshError) {

                processQueue(refreshError, null)
                updateToken(null)
                localStorage.removeItem('hospital_user')
                window.location.href = '/login'
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)

// ── API FUNCTIONS ──────────────────────────────────────────────────────────

export const login    = (data) => api.post('/login', data)
export const register = (data) => api.post('/register', data)
export const updateView = (data) => api.patch('/users/view', data)
export const getPublicStats = () => api.get('/stats/public')

export const getDoctors     = (params)     => api.get('/doctors', { params })
export const getDoctor      = (id)         => api.get(`/doctors/${id}`)
export const getDoctorPriceRange = ()      => api.get('/doctors/price-range')
export const updateDoctor   = (id, data)   => api.put(`/doctors/${id}`, data)
export const getDoctorSlots = (id, date)   => api.get(`/doctors/${id}/slots`, { params: { date } })

export const createAppointment      = (data)      => api.post('/appointments', data)
export const getPatientAppointments = (patientId) => api.get(`/appointments/patient/${patientId}`)
export const getAppointment         = (id)        => api.get(`/appointments/${id}`)
export const updateAppointment      = (id, data)  => api.patch(`/appointments/${id}`, data)

export const getAdminStats          = ()               => api.get('/admin/stats')
export const getAdminRecentActivity = ()               => api.get('/admin/recent-activity')
export const getAdminList           = (table, params)  => api.get(`/admin/${table}`, { params })
export const getAdminRecord         = (table, id)      => api.get(`/admin/${table}/${id}`)
export const updateAdminRecord      = (table, id, data) => api.put(`/admin/${table}/${id}`, data)
export const deleteAdminRecord      = (table, id)      => api.delete(`/admin/${table}/${id}`)

export default api
