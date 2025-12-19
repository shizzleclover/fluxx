import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

export default function LoginPage() {
    const navigate = useNavigate()
    const { setUser, setToken, setLoading, setError, isLoading, error } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const response = await api.login({ email, password })
            setUser(response.user)
            setToken(response.token)
            navigate('/app')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: '#FFFBF5'
        }}>
            {/* Form Section */}
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: 'clamp(1.5rem, 5vw, 4rem)',
                minWidth: 0
            }}>
                <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#FF6B6B' }}>Fluxx</span>
                    </Link>

                    {/* Header */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, color: '#2D2D2D', marginBottom: '0.25rem' }}>
                            Welcome back
                        </h1>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#6B6B6B' }}>
                            Sign in to continue your conversations
                        </p>
                    </div>

                    {/* Demo Credentials */}
                    <div style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#E3F2FD',
                        border: '1px solid #BBDEFB',
                        borderRadius: '10px',
                        marginBottom: '1.25rem'
                    }}>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#1565C0', margin: 0 }}>
                            <strong>Demo:</strong> <code style={{ backgroundColor: '#BBDEFB', padding: '1px 4px', borderRadius: '3px', fontSize: '0.75rem' }}>demo@test.com</code> / <code style={{ backgroundColor: '#BBDEFB', padding: '1px 4px', borderRadius: '3px', fontSize: '0.75rem' }}>demo123</code>
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            backgroundColor: '#FFEBEE',
                            border: '1px solid #FFCDD2',
                            borderRadius: '10px',
                            marginBottom: '1.25rem'
                        }}>
                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#C62828', margin: 0 }}>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: '#2D2D2D', marginBottom: '0.4rem' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9B9B9B' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect width="20" height="16" x="2" y="4" rx="2" />
                                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                </svg>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 12px 12px 40px',
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E5E5',
                                        borderRadius: '10px',
                                        fontFamily: 'DM Sans, sans-serif',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', fontWeight: 500, color: '#2D2D2D', marginBottom: '0.4rem' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9B9B9B' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 40px',
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E5E5',
                                        borderRadius: '10px',
                                        fontFamily: 'DM Sans, sans-serif',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9B9B9B', padding: 0 }}
                                >
                                    {showPassword ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                            <line x1="1" x2="23" y1="1" y2="23" />
                                        </svg>
                                    ) : (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                            <circle cx="12" cy="12" r="3" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#FF6B6B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#6B6B6B' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: '#FF6B6B', fontWeight: 500, textDecoration: 'none' }}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>

            {/* Decorative Panel - Hide on mobile */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #FF6B6B 0%, #FFB88C 50%, #FF8787 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem'
            }} className="auth-decorative-panel">
                <div style={{ textAlign: 'center', maxWidth: '320px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
                        Connect with anyone, anywhere
                    </h2>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                        Join millions making new friends through video and text chat every day.
                    </p>
                </div>
            </div>

            {/* Mobile responsive styles */}
            <style>{`
        @media (max-width: 768px) {
          .auth-decorative-panel {
            display: none !important;
          }
        }
      `}</style>
        </div>
    )
}
