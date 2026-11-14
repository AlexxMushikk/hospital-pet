import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

// Search params that controls can be bound to directly.
// The router applies URL changes as a low-priority transition, so a radio, select or text field
// that read its value straight from the URL kept showing the old value for a few frames after
// every tap or keystroke (a noticeable lag on phones). Here the new params are shown at once and
// the URL follows; a URL changed by anything else (back/forward, a link) still wins.
export function useInstantSearchParams() {
    const [searchParams, setSearchParams] = useSearchParams()
    const urlKey = searchParams.toString()

    // seen: the URL as of the last render; key: the params on screen.
    const [local, setLocal] = useState({ seen: urlKey, key: urlKey })

    let current = local
    if (urlKey !== local.seen) {
        // Our own write landing keeps what is on screen; any other URL change replaces it.
        current = urlKey === local.key ? { ...local, seen: urlKey } : { seen: urlKey, key: urlKey }
        setLocal(current)
    }

    const params = useMemo(() => new URLSearchParams(current.key), [current.key])

    const update = (change) => {
        const next = new URLSearchParams(current.key)
        change(next)
        setLocal(prev => ({ ...prev, key: next.toString() }))   // renders right away
        setSearchParams(next)                                   // a transition, lands later
    }

    return [params, update]
}
