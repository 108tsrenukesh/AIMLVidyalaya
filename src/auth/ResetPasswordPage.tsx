import { useState } from 'react'
import { Link } from 'react-router-dom'
import { resetPassword } from '../utils/auth'

export default function ResetPasswordPage() {
  const [username, setUsername] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const result = await resetPassword(username, recoveryCode, newPassword)
    setLoading(false)
    if (result.success) {
      setSuccess(true)
    } else {
      setError(result.error || 'Reset failed')
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <img src="/logo.svg" alt="Vidyalaya" className="auth-logo" />
          <h1>Password reset</h1>
          <p className="auth-subtitle">Your password has been reset successfully.</p>
          <Link to="/login" className="btn-primary" style={{ textAlign: 'center', display: 'block' }}>
            Sign in with new password
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">V</div>
        <h1>Reset password</h1>
        <p className="auth-subtitle">Enter your username, a recovery code, and a new password</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Recovery Code</label>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              required
            />
          </div>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
            />
          </div>
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <div className="auth-links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </div>
    </div>
  )
}
