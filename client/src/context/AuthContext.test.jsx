import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'

import api from '../api'
import { AuthProvider, useAuth } from './AuthContext'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let calls
let root

beforeEach(() => {
    calls = []
    api.defaults.adapter = (config) => {
        calls.push(config)
        return Promise.resolve({ status: 200, data: {}, headers: {}, config })
    }
    root = createRoot(document.createElement('div'))
})

afterEach(() => {
    act(() => root.unmount())
    vi.restoreAllMocks()
})

// A page that loads its data as soon as it knows who is logged in.
function DataPage() {
    const { user } = useAuth()
    useEffect(() => {
        if (user) api.get('/appointments/patient/1')
    }, [user])
    return null
}

function renderApp(children) {
    return act(async () => {
        root.render(<AuthProvider>{children}</AuthProvider>)
    })
}

describe('access token wiring', () => {
    it('sends the restored token with the first request after a page load', async () => {
        vi.spyOn(axios, 'post').mockResolvedValue({
            data: { user: { id: 1, role: 'patient' }, accessToken: 'restored-token' },
        })

        await renderApp(<DataPage />)

        expect(calls).toHaveLength(1)
        expect(calls[0].headers.Authorization).toBe('Bearer restored-token')
    })

    it('sends the new token with a request made right after login', async () => {
        vi.spyOn(axios, 'post').mockRejectedValue(new Error('no session'))

        const capturedRef = { current: null }
        function Capture({ intoRef }) {
            const auth = useAuth()
            useEffect(() => { intoRef.current = auth })
            return null
        }

        await renderApp(<Capture intoRef={capturedRef} />)

        await act(async () => {
            capturedRef.current.login({ id: 1, role: 'patient' }, 'login-token')
            api.get('/appointments/patient/1')
        })

        expect(calls[0].headers.Authorization).toBe('Bearer login-token')
    })
})
