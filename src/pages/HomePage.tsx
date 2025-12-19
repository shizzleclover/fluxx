import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function HomePage() {
    const navigate = useNavigate()
    const { token, user } = useAuthStore()
    const isLoggedIn = token && user?.isVerified

    const handleStartVideo = () => {
        if (isLoggedIn) {
            navigate('/app')
        } else {
            navigate('/login')
        }
    }

    const handleStartText = () => {
        if (isLoggedIn) {
            navigate('/app')
        } else {
            navigate('/login')
        }
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#FFFBF5', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2rem'
            }}>
                <Link to="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#FF6B6B' }}>
                        Fluxx
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {isLoggedIn ? (
                        <>
                            <Link
                                to="/app"
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    backgroundColor: '#FF6B6B',
                                    color: 'white',
                                    borderRadius: '50px',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Open App
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                style={{
                                    fontFamily: 'DM Sans, sans-serif',
                                    fontSize: '0.875rem',
                                    fontWeight: 500,
                                    color: '#6B6B6B',
                                    textDecoration: 'none'
                                }}
                            >
                                Log in
                            </Link>
                            <Link
                                to="/register"
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    backgroundColor: '#FF6B6B',
                                    color: 'white',
                                    borderRadius: '50px',
                                    fontFamily: 'Outfit, sans-serif',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Sign up
                            </Link>
                        </>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '2rem 4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
                    {/* Left Side - Text */}
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            fontFamily: 'Outfit, sans-serif',
                            fontSize: '3rem',
                            fontWeight: 700,
                            color: '#2D2D2D',
                            lineHeight: 1.2,
                            marginBottom: '1.5rem',
                            fontStyle: 'italic'
                        }}>
                            From strangers to friends,
                            <br />
                            the journey just got easy.
                        </h1>

                        <div style={{ marginTop: '2rem' }}>
                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '1rem', fontWeight: 600, color: '#2D2D2D', marginBottom: '1rem' }}>
                                Start chatting :
                            </p>

                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                <button
                                    onClick={handleStartVideo}
                                    style={{
                                        padding: '0.875rem 2rem',
                                        backgroundColor: '#FF6B6B',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50px',
                                        fontFamily: 'Outfit, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Video
                                </button>
                                <button
                                    onClick={handleStartText}
                                    style={{
                                        padding: '0.875rem 2rem',
                                        backgroundColor: 'transparent',
                                        color: '#FF6B6B',
                                        border: '2px solid #FF6B6B',
                                        borderRadius: '50px',
                                        fontFamily: 'Outfit, sans-serif',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    Text
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Illustrations */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                        <img
                            src="/illustration1.png"
                            alt="Video chat illustration"
                            style={{ maxWidth: '100%', height: 'auto', maxHeight: '280px' }}
                        />
                        <img
                            src="/illustration2.png"
                            alt="Group video chat illustration"
                            style={{ maxWidth: '100%', height: 'auto', maxHeight: '280px' }}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '1rem 2rem' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#FF6B6B' }}>
                    Note : Your video is monitored, please keep it clean.
                </p>
            </footer>
        </div>
    )
}
