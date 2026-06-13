import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import ResetPasswordPage from './auth/ResetPasswordPage'
import ContentLibrary from './content/ContentLibrary'
import ContentViewer from './content/ContentViewer'
import Layout from './components/Layout'
import { getCurrentUser, type User } from './utils/auth'
import UpdatePrompt from './components/UpdatePrompt'

function ProtectedRoute({ children, user }: { children: React.ReactNode; user: User | null }) {
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Loading Vidyalaya...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <UpdatePrompt />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage onRegister={setUser} />} />
        <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
        <Route path="/" element={<ProtectedRoute user={user}><Layout user={user!} onLogout={() => { setUser(null) }} /></ProtectedRoute>}>
          <Route index element={<ContentLibrary />} />
          <Route path="content/:topic/:file" element={<ContentViewer />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
