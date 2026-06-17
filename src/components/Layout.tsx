import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useInstallPrompt } from '../utils/install'

export default function Layout() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })
  const { showInstall, showIosTip, handleInstall, dismissIosTip } = useInstallPrompt()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand" onClick={() => navigate('/')}>
          <img src={`${import.meta.env.BASE_URL}vidyalaya-logo-small.webp`} alt="Vidyalaya" className="brand-logo" />
        </div>
        <div className="header-right">
          {showInstall && (
            <button className="install-btn" onClick={handleInstall} aria-label="Install Vidyalaya">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
              <span>Install</span>
            </button>
          )}
          {showIosTip && (
            <button className="ios-tip-btn" onClick={dismissIosTip} aria-label="iOS install instructions">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>Install</span>
            </button>
          )}
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
        </div>
      </header>
      {showIosTip && (
        <div className="ios-install-tip">
          <div>
            <strong>Install Vidyalaya</strong>
            <p>Tap the Share icon, then "Add to Home Screen"</p>
          </div>
          <button onClick={dismissIosTip} aria-label="Dismiss install instructions">×</button>
        </div>
      )}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
