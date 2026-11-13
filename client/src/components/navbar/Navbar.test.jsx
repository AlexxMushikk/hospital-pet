import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import i18n from '../../i18n'
import en from '../../i18n/en.json'
import pl from '../../i18n/pl.json'
import { AuthProvider } from '../../context/AuthContext'
import Navbar from './Navbar'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container, root

beforeEach(async () => {
    await i18n.changeLanguage('en')
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('no session'))
    container = document.createElement('div')
    root = createRoot(container)
    await act(async () => {
        root.render(
            <MemoryRouter>
                <AuthProvider><Navbar /></AuthProvider>
            </MemoryRouter>
        )
    })
})

afterEach(async () => {
    act(() => root.unmount())
    await i18n.changeLanguage('en')
})

const buttonByText = (text) => [...container.querySelectorAll('button')].find(b => b.textContent === text)

describe('Navbar', () => {
    it('shows guest links in English by default', () => {
        expect(container.textContent).toContain(en.nav.doctors)
        expect(container.textContent).toContain(en.nav.login)
    })

    it('switches every label to Polish from the language switcher', async () => {
        await act(async () => buttonByText(en.lang.pl).click())

        expect(container.textContent).toContain(pl.nav.doctors)
        expect(container.textContent).toContain(pl.nav.register)
        expect(container.textContent).not.toContain(en.nav.login)
        expect(buttonByText(pl.lang.pl).getAttribute('aria-pressed')).toBe('true')
    })
})
