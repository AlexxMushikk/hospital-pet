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

// What a user sees and a screen reader reads: the width-reserving ghosts are aria-hidden.
function visibleText(node = container) {
    const copy = node.cloneNode(true)
    copy.querySelectorAll('[aria-hidden="true"]').forEach(el => el.remove())
    return copy.textContent
}

const buttonByText = (text) => [...container.querySelectorAll('button')].find(b => visibleText(b) === text)

describe('Navbar', () => {
    it('shows guest links in English by default', () => {
        expect(visibleText()).toContain(en.nav.doctors)
        expect(visibleText()).toContain(en.nav.login)
    })

    it('switches every label to Polish from the language switcher', async () => {
        await act(async () => buttonByText(en.lang.pl).click())

        expect(visibleText()).toContain(pl.nav.doctors)
        expect(visibleText()).toContain(pl.nav.register)
        expect(visibleText()).not.toContain(en.nav.login)
        expect(buttonByText(pl.lang.pl).getAttribute('aria-pressed')).toBe('true')
    })

    it('reserves the width of every translation without reading them out', () => {
        const login = [...container.querySelectorAll('a')].find(a => visibleText(a) === en.nav.login)
        const ghost = login.querySelector('.stable-text__ghost')

        expect(ghost.textContent).toBe(pl.nav.login)
        expect(ghost.getAttribute('aria-hidden')).toBe('true')
    })
})
