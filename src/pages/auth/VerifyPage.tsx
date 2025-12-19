import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { useAuthStore } from '../../stores/authStore'

export default function VerifyPage() {
    const navigate = useNavigate()
    const {
        pendingEmail,
        pendingOtp,
        setUser,
        setToken,
        clearPendingVerification,
        setLoading,
        setError,
        isLoading,
        error
    } = useAuthStore()

    const [email, setEmail] = useState(pendingEmail || '')
    const [otp, setOtp] = useState(pendingOtp || '')
    const [resendCooldown, setResendCooldown] = useState(0)
    const [isSuccess, setIsSuccess] = useState(false)

    // Auto-fill from pending verification
    useEffect(() => {
        if (pendingEmail) setEmail(pendingEmail)
        if (pendingOtp) setOtp(pendingOtp)
    }, [pendingEmail, pendingOtp])

    // Countdown timer for resend
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const response = await api.verify({ email, otp })

            // Update auth store
            setUser(response.user)
            setToken(response.token)
            clearPendingVerification()

            setIsSuccess(true)

            // Redirect after short delay
            setTimeout(() => {
                navigate('/app')
            }, 1500)

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendCooldown > 0 || !email) return

        setError(null)
        setLoading(true)

        try {
            const response = await api.resendOtp(email)
            setOtp(response.otp)
            setResendCooldown(30) // 30 second cooldown
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to resend OTP')
        } finally {
            setLoading(false)
        }
    }

    // Success State
    if (isSuccess) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', maxWidth: '400px', padding: '2rem' }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        margin: '0 auto 2rem',
                        backgroundColor: '#E8F5E9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="50" height="50" fill="none" stroke="#4CAF50" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#2D2D2D', marginBottom: '0.5rem' }}>
                        Email Verified!
                    </h1>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6B6B' }}>
                        Redirecting you to Fluxx...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#FFFBF5' }}>
            {/* Left Side - Form */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 4rem' }}>
                <div style={{ maxWidth: '420px', width: '100%', margin: '0 auto' }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'inline-block', marginBottom: '2rem', textDecoration: 'none' }}>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#FF6B6B' }}>Fluxx</span>
                    </Link>

                    {/* Header */}
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 700, color: '#2D2D2D', marginBottom: '0.5rem' }}>
                            Verify your email
                        </h1>
                        <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6B6B' }}>
                            Enter the 6-digit code to verify your email address
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '1rem',
                            backgroundColor: '#FFEBEE',
                            border: '1px solid #FFCDD2',
                            borderRadius: '12px',
                            marginBottom: '1.5rem'
                        }}>
                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#C62828', margin: 0 }}>
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#2D2D2D', marginBottom: '0.5rem' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <svg style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9B9B9B' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                        padding: '14px 14px 14px 44px',
                                        backgroundColor: pendingEmail ? '#F5F5F5' : 'white',
                                        border: '1px solid #E5E5E5',
                                        borderRadius: '12px',
                                        fontFamily: 'DM Sans, sans-serif',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                    readOnly={!!pendingEmail}
                                />
                            </div>
                        </div>

                        {/* OTP */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#2D2D2D', marginBottom: '0.5rem' }}>
                                Verification Code
                            </label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="Enter 6-digit code"
                                required
                                maxLength={6}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E5E5',
                                    borderRadius: '12px',
                                    fontFamily: 'JetBrains Mono, monospace',
                                    fontSize: '1.5rem',
                                    textAlign: 'center',
                                    letterSpacing: '0.5rem',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading || otp.length !== 6}
                            style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#FF6B6B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: (isLoading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                                opacity: (isLoading || otp.length !== 6) ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>

                    {/* Resend OTP */}
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <button
                            onClick={handleResendOtp}
                            disabled={resendCooldown > 0 || isLoading}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontFamily: 'DM Sans, sans-serif',
                                fontSize: '0.875rem',
                                color: resendCooldown > 0 ? '#9B9B9B' : '#FF6B6B',
                                cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                                textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                            }}
                        >
                            {resendCooldown > 0
                                ? `Resend OTP in ${resendCooldown}s`
                                : "Didn't receive code? Resend OTP"
                            }
                        </button>
                    </div>

                    {/* Back to Login */}
                    <p style={{ marginTop: '2rem', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#6B6B6B' }}>
                        Already verified?{' '}
                        <Link to="/login" style={{ color: '#FF6B6B', fontWeight: 500, textDecoration: 'none' }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Decorative */}
            <div style={{
                flex: 1,
                background: 'linear-gradient(135deg, #FFB88C 0%, #FF8787 50%, #FF6B6B 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '96px',
                        height: '96px',
                        margin: '0 auto 2rem',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="48" height="48" fill="none" stroke="white" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.875rem', fontWeight: 700, color: 'white', marginBottom: '1rem' }}>
                        One last step
                    </h2>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1.125rem', color: 'rgba(255,255,255,0.9)' }}>
                        Verify your email to unlock all features and start chatting.
                    </p>
                </div>
            </div>
        </div>
    )
}
