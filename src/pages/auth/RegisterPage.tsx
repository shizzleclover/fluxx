import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { setPendingVerification, setLoading, setError, isLoading, error } = useAuthStore()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [registeredOtp, setRegisteredOtp] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const response = await api.register({ email, password })
            setPendingVerification(email, response.otp || '')
            setRegisteredOtp(response.otp || null)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyOtp = () => {
        if (registeredOtp) {
            navigator.clipboard.writeText(registeredOtp)
        }
    }

    const handleProceedToVerify = () => {
        navigate('/verify')
    }

    // OTP Display after registration
    if (registeredOtp) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFBF5' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(1.5rem, 5vw, 4rem)' }}>
                    <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto', textAlign: 'center' }}>
                        <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none' }}>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#FF6B6B' }}>Fluxx</span>
                        </Link>

                        <div style={{
                            width: '70px',
                            height: '70px',
                            margin: '0 auto 1.25rem',
                            backgroundColor: '#E8F5E9',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="35" height="35" fill="none" stroke="#4CAF50" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.25rem, 5vw, 1.5rem)', fontWeight: 700, color: '#2D2D2D', marginBottom: '0.4rem' }}>
                            Registration Successful!
                        </h1>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#6B6B6B', marginBottom: '1.5rem' }}>
                            Enter the OTP below to verify your email
                        </p>

                        <div style={{
                            backgroundColor: '#FFF4E6',
                            border: '2px dashed #FF6B6B',
                            borderRadius: '14px',
                            padding: '1.5rem',
                            marginBottom: '1.25rem'
                        }}>
                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#6B6B6B', marginBottom: '0.5rem' }}>
                                Your verification code:
                            </p>
                            <div style={{
                                fontFamily: 'JetBrains Mono, monospace',
                                fontSize: 'clamp(2rem, 8vw, 2.5rem)',
                                fontWeight: 700,
                                color: '#FF6B6B',
                                letterSpacing: '0.4rem',
                                marginBottom: '0.75rem'
                            }}>
                                {registeredOtp}
                            </div>
                            <button
                                onClick={handleCopyOtp}
                                style={{
                                    padding: '0.4rem 0.875rem',
                                    backgroundColor: 'transparent',
                                    border: '1px solid #FF6B6B',
                                    borderRadius: '6px',
                                    color: '#FF6B6B',
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Copy OTP
                            </button>
                        </div>

                        <button
                            onClick={handleProceedToVerify}
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
                                cursor: 'pointer',
                                marginBottom: '0.75rem'
                            }}
                        >
                            Proceed to Verify Email
                        </button>

                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#9B9B9B' }}>
                            Email sent to: <strong>{email}</strong>
                        </p>
                    </div>
                </div>

                <div style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #A8E6CF 0%, #FFB88C 50%, #FF8787 100%)',
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
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <svg width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
                            Almost there!
                        </h2>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                            Verify your email to start making connections on Fluxx.
                        </p>
                    </div>
                </div>

                <style>{`
          @media (max-width: 768px) {
            .auth-decorative-panel { display: none !important; }
          }
        `}</style>
            </div>
        )
    }

    // Registration Form
    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFBF5' }}>
            {/* Decorative Panel */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #B8B5FF 0%, #A8E6CF 50%, #FFB88C 100%)',
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
                        backgroundColor: 'rgba(255,255,255,0.25)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="40" height="40" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
                        Meet new people today
                    </h2>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                        Join thousands making meaningful connections every day.
                    </p>
                </div>
            </div>

            {/* Form Section */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 'clamp(1.5rem, 5vw, 4rem)' }}>
                <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto' }}>
                    <Link to="/" style={{ display: 'inline-block', marginBottom: '1.5rem', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.75rem', fontWeight: 700, color: '#FF6B6B' }}>Fluxx</span>
                    </Link>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 700, color: '#2D2D2D', marginBottom: '0.25rem' }}>
                            Create account
                        </h1>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#6B6B6B' }}>
                            Join Fluxx and start chatting
                        </p>
                    </div>

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

                    <form onSubmit={handleSubmit}>
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
                                    placeholder="you@university.edu"
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
                                    placeholder="Min. 6 characters"
                                    required
                                    minLength={6}
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
                            {isLoading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <p style={{ marginTop: '1.5rem', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', color: '#6B6B6B' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ color: '#FF6B6B', fontWeight: 500, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          .auth-decorative-panel { display: none !important; }
        }
      `}</style>
        </div>
    )
}
