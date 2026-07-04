import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { setTokenGetter } from '../api/index'

export default function ApiTokenBridge({ children }) {
    const { token, updateToken } = useAuth()

    useEffect(() => {
        setTokenGetter(() => token, updateToken)
    }, [token, updateToken])

    return children
}