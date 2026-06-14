import { useState } from 'react'
import { Link } from 'react-router-dom'
import { register, type User } from '../utils/auth'

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

  if (recoveryCodes.length > 0) {
    return (
      <div className="auth-page">
        <div className="auth-card recovery-card">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="Vidyalaya" className="auth-logo" />
          <h1>Save your recovery codes</h1>
          <p className="auth-subtitle">
            Store these codes somewhere safe. Each code can be used once to reset your password.
          </p>
          <div className="recovery-codes">
            {recoveryCodes.map((code, i) => (
              <div key={i} className="recovery-code">{code}</div>
            ))}
          </div>
          <button className="btn-primary" onClick={handleContinue}>
            I've saved my codes — Continue
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">V</div>
        <h1>Create account</h1>
        <p className="auth-subtitle">Join the learning community</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ chars, upper, lower, digit"
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  )
}
