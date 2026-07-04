import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './context/AuthContext'
import ApiTokenBridge from './components/ApiTokenBridge'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AuthProvider>
            <ApiTokenBridge>
                <App />
            </ApiTokenBridge>
        </AuthProvider>
    </StrictMode>
)