import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AccessibilityProvider } from './context/AccessibilityContext.jsx'
import { ProfileProvider } from './context/ProfileContext.jsx'
import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AccessibilityProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
