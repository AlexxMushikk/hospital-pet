import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Link, useLocation, useNavigate } from 'react-router-dom'

import { useInstantSearchParams } from './useInstantSearchParams'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container, root

function Harness() {
    const [params, update] = useInstantSearchParams()
    const location = useLocation()
    const navigate = useNavigate()
    return (
        <>
            <output id="shown">{params.toString()}</output>
            <output id="url">{location.search}</output>
            <button id="gender" onClick={() => update(next => next.set('gender', 'Female'))} />
            <button id="spec"   onClick={() => update(next => next.set('spec', 'Cardiology'))} />
            <button id="back"   onClick={() => navigate(-1)} />
            <Link id="external" to="/?spec=Surgery">surgery</Link>
        </>
    )
}

const text  = (id) => container.querySelector(`#${id}`).textContent
const click = (id) => act(async () => container.querySelector(`#${id}`).click())

beforeEach(async () => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    await act(async () => root.render(<MemoryRouter initialEntries={['/?page=2']}><Harness /></MemoryRouter>))
})

afterEach(() => {
    act(() => root.unmount())
    container.remove()
})

describe('useInstantSearchParams', () => {
    it('starts from the URL', () => {
        expect(text('shown')).toBe('page=2')
    })

    it('shows a change and writes it to the URL', async () => {
        await click('gender')

        expect(text('shown')).toBe('page=2&gender=Female')
        expect(text('url')).toBe('?page=2&gender=Female')
    })

    it('keeps earlier changes when the next one comes', async () => {
        await click('gender')
        await click('spec')

        expect(text('shown')).toBe('page=2&gender=Female&spec=Cardiology')
        expect(text('url')).toBe('?page=2&gender=Female&spec=Cardiology')
    })

    it('follows a link that changes the URL', async () => {
        await click('gender')
        await click('external')

        expect(text('shown')).toBe('spec=Surgery')
    })

    it('follows the back button', async () => {
        await click('gender')
        await click('back')

        expect(text('url')).toBe('?page=2')
        expect(text('shown')).toBe('page=2')
    })
})
