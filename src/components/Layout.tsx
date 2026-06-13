import { Outlet, useNavigate } from 'react-router-dom'
import { logout, type User } from '../utils/auth'

export default function Layout({ user, onLogout }: { user: User; onLogout: () => void }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    onLogout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-brand" onClick={() => navigate('/')}>
          <span className="brand-icon">V</span>
          <span className="brand-text">Vidyalaya</span>
        </div>
        <div className="header-right">
          <span className="user-name">{user.username}</span>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
