import { useState } from 'react'
import { Link } from 'react-router-dom'
import { register, type User } from '../utils/auth'

function AuthBackground() {
  return (
    <>
      <div className="glow glow-1" />
      <div className="glow glow-2" />
      <div className="glow glow-3" />
      <svg className="wave-bg wave-left" viewBox="0 0 500 500" preserveAspectRatio="none">
        <path d="M-50,200 C50,150 150,280 250,200 C350,120 450,250 550,180 L550,500 L-50,500 Z" fill="url(#wg1)" opacity="0.4" />
        <path d="M-50,280 C80,220 200,330 320,260 C440,190 540,300 660,230 L660,500 L-50,500 Z" fill="url(#wg2)" opacity="0.25" />
        <path d="M-50,350 C100,300 250,370 380,310 C510,250 620,340 740,280 L740,500 L-50,500 Z" fill="url(#wg3)" opacity="0.15" />
        <defs>
          <linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wg2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6d28d9" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="wg3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
          </linearGradient>
        </defs>
      </svg>
      <svg className="wave-bg wave-right" viewBox="0 0 500 500" preserveAspectRatio="none">
        <path d="M550,180 C450,260 350,140 250,220 C150,300 50,180 -50,260 L-50,500 L550,500 Z" fill="url(#wg4)" opacity="0.35" />
        <path d="M550,260 C430,200 310,310 190,240 C70,170 -50,280 -170,210 L-170,500 L550,500 Z" fill="url(#wg5)" opacity="0.2" />
        <path d="M550,340 C450,280 330,370 210,310 C90,250 -30,340 -150,280 L-150,500 L550,500 Z" fill="url(#wg6)" opacity="0.12" />
        <defs>
          <linearGradient id="wg4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="wg5" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="wg6" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
          </linearGradient>
        </defs>
      </svg>
      <div className="float-icon fi-book" style={{top:'18%',left:'10%'}}>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M8 32V10a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v22" />
          <path d="M8 32c0-2 2-4 4-4s4 2 4 4" />
          <path d="M20 32c0-2 2-4 4-4s4 2 4 4" />
          <line x1="20" y1="8" x2="20" y2="32" />
        </svg>
      </div>
      <div className="float-icon fi-code" style={{top:'55%',left:'7%'}}>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <polyline points="14,12 6,20 14,28" />
          <polyline points="26,12 34,20 26,28" />
          <line x1="22" y1="8" x2="18" y2="32" />
        </svg>
      </div>
      <div className="float-icon fi-chart" style={{bottom:'22%',left:'12%'}}>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="6" y="22" width="6" height="12" rx="1" />
          <rect x="17" y="14" width="6" height="20" rx="1" />
          <rect x="28" y="8" width="6" height="26" rx="1" />
        </svg>
      </div>
      <div className="float-icon fi-brain" style={{top:'14%',right:'10%'}}>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="20" cy="18" r="12" />
          <circle cx="20" cy="18" r="5" />
          <line x1="20" y1="6" x2="20" y2="10" />
          <line x1="20" y1="26" x2="20" y2="30" />
          <line x1="8" y1="18" x2="12" y2="18" />
          <line x1="28" y1="18" x2="32" y2="18" />
          <line x1="11" y1="9" x2="14" y2="12" />
          <line x1="26" y1="9" x2="29" y2="12" />
        </svg>
      </div>
      <div className="float-icon fi-robot" style={{top:'50%',right:'6%'}}>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <rect x="10" y="18" width="20" height="16" rx="3" />
          <circle cx="15" cy="26" r="2" />
          <circle cx="25" cy="26" r="2" />
          <line x1="20" y1="6" x2="20" y2="14" />
          <circle cx="20" cy="5" r="2" />
          <line x1="14" y1="18" x2="10" y2="12" />
          <line x1="26" y1="18" x2="30" y2="12" />
        </svg>
      </div>
      <div className="float-icon fi-bulb" style={{bottom:'18%',right:'12%'}}>
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M16 32h8" />
          <path d="M18 36h4" />
          <path d="M20 4a12 12 0 0 0-6 22.5V30h12v-3.5A12 12 0 0 0 20 4z" />
          <line x1="14" y1="30" x2="26" y2="30" />
        </svg>
      </div>
    </>
  )
}

function AuthTagline() {
  return (
    <div className="tagline">
      <span className="tagline-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        LEARN
      </span>
      <span className="tagline-dot">•</span>
      <span className="tagline-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        BUILD
      </span>
      <span className="tagline-dot">•</span>
      <span className="tagline-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        INNOVATE
      </span>
    </div>
  )
}

function AuthLogo() {
  return <img src={`${import.meta.env.BASE_URL}vidyalaya-logo.png`} alt="Vidyalaya" className="auth-logo" onError={(e) => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo.svg` }} />
}

export default function RegisterPage({ onRegister }: { onRegister: (user: User) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const result = await register(username, password)
    setLoading(false)
    if (result.success && result.recoveryCodes) {
      setRecoveryCodes(result.recoveryCodes)
    } else {
      setError(result.error || 'Registration failed')
    }
  }

  const handleContinue = () => {
    onRegister({ id: '', username })
  }

  const downloadRecoveryCodes = () => {
    const csv = 'Recovery Code\n' + recoveryCodes.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vidyalaya-recovery-codes-${username}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (recoveryCodes.length > 0) {
    return (
      <div className="auth-page">
        <AuthBackground />
        <div className="auth-card recovery-card">
          <AuthLogo />
          <h1>Save your recovery codes</h1>
          <p className="auth-subtitle">
            Store these codes somewhere safe. Each code can be used once to reset your password.
          </p>
          <div className="recovery-codes">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="recovery-code">{code}</div>
            ))}
          </div>
          <button className="btn-secondary" onClick={downloadRecoveryCodes}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16,marginRight:6}}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download as CSV
          </button>
          <button className="btn-primary" onClick={handleContinue}>
            I've saved my codes — Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <AuthBackground />
      <div className="auth-card">
        <AuthLogo />
        <h1>Create account</h1>
        <p className="auth-subtitle">Join the learning community</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                required
                autoFocus
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <span className="form-hint">Min 8 characters with uppercase, lowercase, and a number</span>
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
            {!loading && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-arrow">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}
