import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'

async function loadApi() {
    vi.resetModules()
    return import('./index.js')
}

function stubTransport(api, plan) {
    const calls = []

    api.defaults.adapter = (config) => {
        calls.push(config)

        const step = plan[calls.length - 1] ?? plan[plan.length - 1]

        if (step.status >= 400) {
            const error = new Error(`Request failed with status ${step.status}`)
            error.config      = config
            error.response    = { status: step.status, data: step.data ?? {}, config }
            error.isAxiosError = true
            return Promise.reject(error)
        }

        return Promise.resolve({
            status: step.status, data: step.data ?? {}, headers: {}, config,
        })
    }

    return calls
}

let locationStub

beforeEach(() => {
    locationStub = { href: '/doctors' }
    vi.stubGlobal('location', locationStub)
    Object.defineProperty(window, 'location', { value: locationStub, writable: true })
})

afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
})

describe('request interceptor', () => {
    it('attaches the access token supplied by the auth context', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => 'token-123', () => {})

        const calls = stubTransport(api, [{ status: 200 }])
        await api.get('/doctors')

        expect(calls[0].headers.Authorization).toBe('Bearer token-123')
    })

    it('sends no Authorization header when nobody is logged in', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => null, () => {})

        const calls = stubTransport(api, [{ status: 200 }])
        await api.get('/doctors')

        expect(calls[0].headers.Authorization).toBeUndefined()
    })
})

describe('response interceptor: refresh on 401', () => {
    it('refreshes, stores the new token and replays the original request', async () => {
        const { default: api, setTokenGetter } = await loadApi()

        const updateToken = vi.fn()
        setTokenGetter(() => 'expired-token', updateToken)

        const refresh = vi.spyOn(axios, 'post')
            .mockResolvedValue({ data: { accessToken: 'fresh-token' } })

        const calls = stubTransport(api, [
            { status: 401 },
            { status: 200, data: { id: 1 } },
        ])

        const res = await api.get('/appointments/1')

        expect(refresh).toHaveBeenCalledWith('/api/refresh', {}, { withCredentials: true })
        expect(updateToken).toHaveBeenCalledWith('fresh-token')
        expect(res.data).toEqual({ id: 1 })

        expect(calls).toHaveLength(2)
        expect(calls[1].url).toBe('/appointments/1')
        expect(calls[1].headers.Authorization).toBe('Bearer fresh-token')
    })

    it('retries a request only once', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => 'expired-token', vi.fn())

        vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'fresh-token' } })

        const calls = stubTransport(api, [{ status: 401 }])

        await expect(api.get('/appointments/1')).rejects.toThrow()
        expect(calls).toHaveLength(2)
    })

    it('does not try to refresh on a failed login', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => null, vi.fn())

        const refresh = vi.spyOn(axios, 'post')
        const calls   = stubTransport(api, [{ status: 401, data: { error: 'Invalid credentials' } }])

        await expect(api.post('/login', {})).rejects.toThrow()

        expect(refresh).not.toHaveBeenCalled()
        expect(calls).toHaveLength(1)
    })

    it('leaves other error codes alone', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => 'token', vi.fn())

        const refresh = vi.spyOn(axios, 'post')
        stubTransport(api, [{ status: 403 }])

        await expect(api.get('/admin/patients')).rejects.toThrow()
        expect(refresh).not.toHaveBeenCalled()
    })
})

describe('response interceptor: concurrent 401s', () => {
    it('refreshes once and replays every queued request', async () => {
        const { default: api, setTokenGetter } = await loadApi()

        const updateToken = vi.fn()
        setTokenGetter(() => 'expired-token', updateToken)

        const refresh = vi.spyOn(axios, 'post')
            .mockResolvedValue({ data: { accessToken: 'fresh-token' } })

        // First three calls (the three originals) fail, everything after
        // succeeds — those are the replays.
        const calls = []
        api.defaults.adapter = (config) => {
            calls.push(config)

            if (calls.length <= 3) {
                const error = new Error('401')
                error.config   = config
                error.response = { status: 401, data: {}, config }
                error.isAxiosError = true
                return Promise.reject(error)
            }

            return Promise.resolve({ status: 200, data: { url: config.url }, headers: {}, config })
        }

        const results = await Promise.all([
            api.get('/doctors'),
            api.get('/appointments/1'),
            api.get('/admin/stats'),
        ])

        expect(refresh).toHaveBeenCalledTimes(1)
        expect(updateToken).toHaveBeenCalledTimes(1)
        expect(results.map(r => r.data.url).sort())
            .toEqual(['/admin/stats', '/appointments/1', '/doctors'])

        expect(calls).toHaveLength(6)
    })

    it('gives the queued requests the refreshed token', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => 'expired-token', vi.fn())

        vi.spyOn(axios, 'post').mockResolvedValue({ data: { accessToken: 'fresh-token' } })

        const calls = []
        api.defaults.adapter = (config) => {
            calls.push(config)

            if (calls.length <= 2) {
                const error = new Error('401')
                error.config   = config
                error.response = { status: 401, data: {}, config }
                error.isAxiosError = true
                return Promise.reject(error)
            }

            return Promise.resolve({ status: 200, data: {}, headers: {}, config })
        }

        await Promise.all([api.get('/doctors'), api.get('/appointments/1')])

        const replays = calls.slice(2)
        expect(replays).toHaveLength(2)
        replays.forEach(config => {
            expect(config.headers.Authorization).toBe('Bearer fresh-token')
        })
    })
})

describe('response interceptor: refresh fails', () => {
    it('clears the token and sends the user to the login page', async () => {
        const { default: api, setTokenGetter } = await loadApi()

        const updateToken = vi.fn()
        setTokenGetter(() => 'expired-token', updateToken)

        vi.spyOn(axios, 'post').mockRejectedValue(new Error('Session revoked'))

        stubTransport(api, [{ status: 401 }])

        await expect(api.get('/appointments/1')).rejects.toThrow('Session revoked')

        expect(updateToken).toHaveBeenCalledWith(null)
        expect(locationStub.href).toBe('/login')
    })

    it('rejects the queued requests too instead of leaving them pending', async () => {
        const { default: api, setTokenGetter } = await loadApi()
        setTokenGetter(() => 'expired-token', vi.fn())

        vi.spyOn(axios, 'post').mockRejectedValue(new Error('Session revoked'))

        api.defaults.adapter = (config) => {
            const error = new Error('401')
            error.config   = config
            error.response = { status: 401, data: {}, config }
            error.isAxiosError = true
            return Promise.reject(error)
        }

        const results = await Promise.allSettled([
            api.get('/doctors'),
            api.get('/appointments/1'),
        ])

        expect(results.map(r => r.status)).toEqual(['rejected', 'rejected'])
    })

    it('allows a fresh refresh after a failed one', async () => {
        const { refreshSession } = await loadApi()

        const post = vi.spyOn(axios, 'post')
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValueOnce({ data: { accessToken: 'fresh-token' } })

        await expect(refreshSession()).rejects.toThrow('boom')
        await expect(refreshSession()).resolves.toEqual({ accessToken: 'fresh-token' })

        expect(post).toHaveBeenCalledTimes(2)
    })
})

describe('refreshSession', () => {
    it('shares one in-flight request between callers', async () => {
        const { refreshSession } = await loadApi()

        const post = vi.spyOn(axios, 'post')
            .mockResolvedValue({ data: { accessToken: 'fresh-token' } })

        const [a, b, c] = await Promise.all([refreshSession(), refreshSession(), refreshSession()])

        expect(post).toHaveBeenCalledTimes(1)
        expect(a).toEqual({ accessToken: 'fresh-token' })
        expect(b).toEqual(a)
        expect(c).toEqual(a)
    })

    it('starts a new request once the previous one settled', async () => {
        const { refreshSession } = await loadApi()

        const post = vi.spyOn(axios, 'post')
            .mockResolvedValue({ data: { accessToken: 'fresh-token' } })

        await refreshSession()
        await refreshSession()

        expect(post).toHaveBeenCalledTimes(2)
    })
})
