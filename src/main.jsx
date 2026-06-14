import React from 'react'
import ReactDOM from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const root = ReactDOM.createRoot(document.getElementById('root'))

if (!PUBLISHABLE_KEY) {
  // Fail gracefully instead of a blank screen if the key isn't configured.
  root.render(
    <div className="config-needed">
      <h1>⚙️ Нужна е настройка</h1>
      <p>
        Липсва <code>VITE_CLERK_PUBLISHABLE_KEY</code>. Добави го в настройките на
        проекта (Vercel → Environment Variables и локалния <code>.env</code> файл),
        след което презареди страницата.
      </p>
    </div>
  )
} else {
  root.render(
    <React.StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </React.StrictMode>
  )
}
