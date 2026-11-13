import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import i18n from '../../i18n'
import en from '../../i18n/en.json'
import pl from '../../i18n/pl.json'
import api from '../../api'
import { AuthProvider } from '../../context/AuthContext'
import Login from './Login'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container, root

// React tracks input values itself, so a test has to go through the native setter.
function type(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
}

async function submit(email, password) {
    const [emailInput, passwordInput] = container.querySelectorAll('input')
    await act(async () => {
        type(emailInput, email)
        type(passwordInput, password)
    })
    await act(async () => {
        container.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
}

beforeEach(async () => {
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('no session'))
    api.defaults.adapter = (config) => Promise.reject(Object.assign(new Error('401'), {
        config,
        response: { status: 401, data: { error: 'Invalid credentials', code: 'errors.INVALID_CREDENTIALS' }, config },
    }))

    container = document.createElement('div')
    root = createRoot(container)
    await act(async () => {
        root.render(<MemoryRouter><AuthProvider><Login /></AuthProvider></MemoryRouter>)
    })
})

afterEach(async () => {
    act(() => root.unmount())
    await i18n.changeLanguage('en')
})

describe('Login page', () => {
    it('shows the server error in the interface language', async () => {
        await act(async () => { await i18n.changeLanguage('pl') })

        await submit('ann@test.com', 'wrongpass')

        expect(container.textContent).toContain(pl.errors.INVALID_CREDENTIALS)
        expect(container.textContent).not.toContain('Invalid credentials')
    })

    it('validates the email before calling the server', async () => {
        await submit('not-an-email', 'whatever')

        expect(container.textContent).toContain(en.validation.email)
    })
})
