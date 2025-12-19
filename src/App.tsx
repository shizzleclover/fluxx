import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import HomePage from './pages/HomePage'
import RegisterPage from './pages/auth/RegisterPage'
import VerifyPage from './pages/auth/VerifyPage'
import LoginPage from './pages/auth/LoginPage'
import MainPage from './pages/app/MainPage'
import VideoChatPage from './pages/chat/VideoChatPage'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore()

  if (!token || !user?.isVerified) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Auth route wrapper (redirect if already logged in)
function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore()

  if (token && user?.isVerified) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />

        {/* Auth Routes */}
        <Route path="/login" element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        } />
        <Route path="/register" element={
          <AuthRoute>
            <RegisterPage />
          </AuthRoute>
        } />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/verify" element={<VerifyPage />} />

        {/* Protected Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <MainPage />
          </ProtectedRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <VideoChatPage />
          </ProtectedRoute>
        } />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App