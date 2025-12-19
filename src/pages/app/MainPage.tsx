import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useMatchStore } from '../../stores/matchStore'
import { socketService } from '../../services/socket'
import { webrtcService } from '../../services/webrtc'

export default function MainPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const { queueStatus, setQueueStatus, setCurrentMatch } = useMatchStore()

    // Connect socket on mount
    useEffect(() => {
        const connectSocket = async () => {
            if (!socketService.isConnected) {
                try {
                    await socketService.connect()
                    console.log('[MainPage] Socket connected')
                } catch (error) {
                    console.error('[MainPage] Socket connection failed:', error)
                }
            }
        }

        connectSocket()

        // Listen for queue events
        const handleQueueJoined = () => {
            console.log('[MainPage] Queue joined')
            setQueueStatus('searching')
        }

        const handleQueueLeft = () => {
            console.log('[MainPage] Queue left')
            setQueueStatus('idle')
        }

        const handleMatchFound = (data: unknown) => {
            const matchData = data as { roomId: string; partnerId: string }
            console.log('[MainPage] Match found:', matchData)
            setQueueStatus('matched')
            setCurrentMatch({
                roomId: matchData.roomId,
                partnerId: matchData.partnerId
            })
            // Navigate to chat page
            navigate('/chat')
        }

        const handleError = (data: unknown) => {
            const errorData = data as { message: string }
            console.error('[MainPage] Socket error:', errorData.message)
            setQueueStatus('idle')
        }

        const handleBanned = (data: unknown) => {
            const banData = data as { message: string; banReason: string }
            console.error('[MainPage] User banned:', banData.message)
            alert(`You have been banned: ${banData.banReason}`)
            logout()
            navigate('/')
        }

        socketService.on('queue_joined', handleQueueJoined)
        socketService.on('queue_left', handleQueueLeft)
        socketService.on('match_found', handleMatchFound)
        socketService.on('error', handleError)
        socketService.on('banned', handleBanned)

        return () => {
            socketService.off('queue_joined', handleQueueJoined)
            socketService.off('queue_left', handleQueueLeft)
            socketService.off('match_found', handleMatchFound)
            socketService.off('error', handleError)
            socketService.off('banned', handleBanned)
        }
    }, [navigate, setQueueStatus, setCurrentMatch, logout])

    const handleStartVideo = async () => {
        try {
            // Request camera/mic permissions and start local video
            await webrtcService.getLocalStream()

            // Join matchmaking queue
            socketService.joinQueue()
        } catch (error) {
            console.error('Failed to start video:', error)
            alert('Camera/microphone access is required. Please allow permissions and try again.')
        }
    }

    const handleCancelSearch = () => {
        socketService.leaveQueue()
        webrtcService.stopLocalStream()
        setQueueStatus('idle')
    }

    const handleLogout = () => {
        socketService.disconnect()
        webrtcService.stop()
        logout()
        navigate('/')
    }

    const isSearching = queueStatus === 'searching' || queueStatus === 'matched' || queueStatus === 'connecting'

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#FFFBF5', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 2rem',
                borderBottom: '1px solid #F0F0F0'
            }}>
                <Link to="/app" style={{ textDecoration: 'none' }}>
                    <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#FF6B6B' }}>
                        Fluxx
                    </span>
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* User Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: '#FFE5E5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, color: '#FF6B6B' }}>
                                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                            </span>
                        </div>
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#2D2D2D' }}>
                            {user?.displayName || 'User'}
                        </span>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: 'transparent',
                            border: '1px solid #E5E5E5',
                            borderRadius: '8px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '0.875rem',
                            color: '#6B6B6B',
                            cursor: 'pointer'
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ textAlign: 'center', maxWidth: '500px' }}>
                    {/* Status Icon */}
                    <div style={{
                        width: '120px',
                        height: '120px',
                        margin: '0 auto 2rem',
                        backgroundColor: isSearching ? '#FFF4E6' : '#FFE5E5',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: isSearching ? 'pulse 2s infinite' : 'none'
                    }}>
                        {isSearching ? (
                            <svg width="60" height="60" fill="none" stroke="#FF6B6B" strokeWidth="1.5" viewBox="0 0 24 24" style={{ animation: 'spin 2s linear infinite' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        ) : (
                            <svg width="60" height="60" fill="none" stroke="#FF6B6B" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </div>

                    {/* Status Text */}
                    <h1 style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#2D2D2D',
                        marginBottom: '0.75rem'
                    }}>
                        {queueStatus === 'idle' && 'Ready to chat?'}
                        {queueStatus === 'searching' && 'Looking for someone...'}
                        {queueStatus === 'matched' && 'Match found!'}
                        {queueStatus === 'connecting' && 'Connecting...'}
                    </h1>

                    <p style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: '1rem',
                        color: '#6B6B6B',
                        marginBottom: '2rem'
                    }}>
                        {queueStatus === 'idle' && 'Click the button below to start a random video chat'}
                        {queueStatus === 'searching' && 'Hang tight! We\'re finding you a match...'}
                        {queueStatus === 'matched' && 'Setting up your video chat...'}
                        {queueStatus === 'connecting' && 'Almost there...'}
                    </p>

                    {/* Action Buttons */}
                    {queueStatus === 'idle' ? (
                        <button
                            onClick={handleStartVideo}
                            style={{
                                padding: '1rem 3rem',
                                backgroundColor: '#FF6B6B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '50px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600,
                                fontSize: '1.25rem',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
                                transition: 'transform 0.2s, box-shadow 0.2s'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)'
                                e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 107, 107, 0.4)'
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)'
                                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.3)'
                            }}
                        >
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Start Video
                        </button>
                    ) : (
                        <button
                            onClick={handleCancelSearch}
                            style={{
                                padding: '1rem 2rem',
                                backgroundColor: 'white',
                                color: '#FF6B6B',
                                border: '2px solid #FF6B6B',
                                borderRadius: '50px',
                                fontFamily: 'Outfit, sans-serif',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '1rem 2rem', textAlign: 'center', borderTop: '1px solid #F0F0F0' }}>
                <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: '#9B9B9B' }}>
                    Note: Your video is monitored. Please keep it clean.
                </p>
            </footer>

            {/* CSS Animations */}
            <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
