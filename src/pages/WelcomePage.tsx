import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function WelcomePage() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return (
    <div className="welcome-page">
      <div className="welcome-bg">
        <div className="welcome-orb welcome-orb-1" />
        <div className="welcome-orb welcome-orb-2" />
        <div className="welcome-orb welcome-orb-3" />
      </div>

      <button className="welcome-theme-toggle" onClick={toggleTheme}>
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

      <div className="welcome-content">
        <div className="welcome-logo">
          <img src={`${import.meta.env.BASE_URL}vidyalaya-logo.png`} alt="Vidyalaya" className="welcome-logo-img" />
        </div>

        <h1 className="welcome-title">Vidyalaya</h1>
        <p className="welcome-subtitle">AI & Machine Learning Learning Hub</p>

        <div className="welcome-divider" />

        <p className="welcome-desc">
          Join our community of learners exploring the frontiers of AI.
          Access curated content, hands-on projects, and deep-dive references — all in one place.
        </p>

        <button className="welcome-btn" onClick={() => navigate('/library')}>
          Welcome
        </button>

        <p className="welcome-note">No login required. Just dive in.</p>
      </div>
    </div>
  )
}
