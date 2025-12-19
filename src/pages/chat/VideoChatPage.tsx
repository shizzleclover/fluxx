import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchStore } from '../../stores/matchStore'
import { useVideoStore } from '../../stores/videoStore'
import { socketService } from '../../services/socket'
import { webrtcService } from '../../services/webrtc'
import ReportModal from '../../components/ReportModal'

export default function VideoChatPage() {
    const navigate = useNavigate()
    const { currentMatch, queueStatus, reset: resetMatch } = useMatchStore()
    const {
        localStream,
        remoteStream,
        isMuted,
        isVideoOn,
        connectionStatus,
        toggleMute,
        toggleVideo,
        reset: resetVideo
    } = useVideoStore()

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [partnerLeft, setPartnerLeft] = useState(false)

    // Setup video streams
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream])

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    // Start mock connection when matched
    useEffect(() => {
        if (currentMatch && queueStatus === 'connected') {
            webrtcService.startMockConnection()
        }
    }, [currentMatch, queueStatus])

    // Listen for partner leaving
    useEffect(() => {
        const handlePartnerLeft = () => {
            setPartnerLeft(true)
            setTimeout(() => {
                setPartnerLeft(false)
                socketService.joinQueue()
            }, 2000)
        }

        socketService.on('partner_left', handlePartnerLeft)
        return () => {
            socketService.off('partner_left', handlePartnerLeft)
        }
    }, [])

    // Listen for new matches
    useEffect(() => {
        const handleMatchFound = () => {
            setPartnerLeft(false)
        }

        socketService.on('match_found', handleMatchFound)
        return () => {
            socketService.off('match_found', handleMatchFound)
        }
    }, [])

    // Redirect if no match
    useEffect(() => {
        if (!currentMatch && queueStatus === 'idle') {
            navigate('/app')
        }
    }, [currentMatch, queueStatus, navigate])

    const handleNext = () => {
        setPartnerLeft(false)
        socketService.nextMatch()
    }

    const handleEndChat = () => {
        socketService.endChat()
        webrtcService.stop()
        resetMatch()
        resetVideo()
        navigate('/app')
    }

    const handleToggleMute = () => {
        toggleMute()
        webrtcService.toggleMute()
    }

    const handleToggleVideo = () => {
        toggleVideo()
        webrtcService.toggleVideo()
    }

    const isSearching = queueStatus === 'searching' || queueStatus === 'matched' || queueStatus === 'connecting'
    const isConnected = queueStatus === 'connected' && connectionStatus === 'connected'

    // Control button style
    const controlBtnStyle = (isActive: boolean, isWarning = false): React.CSSProperties => ({
        width: '48px',
        height: '48px',
        minWidth: '48px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: isWarning ? '#EF4444' : (isActive ? 'rgba(255,255,255,0.1)' : '#EF4444'),
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background-color 0.2s',
        flexShrink: 0
    })

    return (
        <div style={{
            height: '100vh',
            backgroundColor: '#1A1A1A',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Video Container */}
            <div style={{ flex: 1, position: 'relative' }}>
                {/* Remote Video (Full Screen) */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#2D2D2D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isConnected && remoteStream ? (
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : isSearching ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                margin: '0 auto 1rem',
                                border: '3px solid #FF6B6B',
                                borderTopColor: 'transparent',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.125rem', color: 'white' }}>
                                {queueStatus === 'searching' && 'Finding someone...'}
                                {queueStatus === 'matched' && 'Match found!'}
                                {queueStatus === 'connecting' && 'Connecting...'}
                            </p>
                        </div>
                    ) : partnerLeft ? (
                        <div style={{ textAlign: 'center', padding: '1rem' }}>
                            <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.125rem', color: 'white', marginBottom: '0.5rem' }}>
                                Partner left
                            </p>
                            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#9B9B9B' }}>
                                Finding next match...
                            </p>
                        </div>
                    ) : (
                        <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6B6B' }}>
                            Waiting for video...
                        </p>
                    )}
                </div>

                {/* Local Video (Picture-in-Picture) - responsive sizing */}
                <div style={{
                    position: 'absolute',
                    bottom: '90px',
                    right: '12px',
                    width: 'min(35vw, 180px)',
                    height: 'min(26vw, 135px)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#1A1A1A',
                    border: '2px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                }}>
                    {localStream ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)',
                                opacity: isVideoOn ? 1 : 0.3
                            }}
                        />
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="32" height="32" fill="none" stroke="#6B6B6B" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                            </svg>
                        </div>
                    )}

                    {/* Mute indicator */}
                    {isMuted && (
                        <div style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            backgroundColor: 'rgba(239, 68, 68, 0.9)',
                            borderRadius: '4px',
                            padding: '3px 5px'
                        }}>
                            <svg width="10" height="10" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Partner Name */}
                {currentMatch && isConnected && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4CAF50' }} />
                        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', color: 'white' }}>
                            {currentMatch.partnerName}
                        </span>
                    </div>
                )}
            </div>

            {/* Controls Bar - Mobile optimized */}
            <div style={{
                padding: '0.75rem 1rem',
                paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
                backgroundColor: '#1A1A1A',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
            }}>
                {/* Mute Button */}
                <button onClick={handleToggleMute} style={controlBtnStyle(!isMuted)} title={isMuted ? 'Unmute' : 'Mute'}>
                    {isMuted ? (
                        // Muted - show mic with X
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 19L5 5M12 18.75a6 6 0 01-6-6v-1.5m6 7.5a6 6 0 006-6v-1.5m-6 7.5v3.75m-3.75 0h7.5M12 14.25a3 3 0 01-3-3V5.25a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    ) : (
                        // Unmuted - show normal mic
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 14.25a3 3 0 01-3-3V5.25a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                {/* Video Button */}
                <button onClick={handleToggleVideo} style={controlBtnStyle(isVideoOn)} title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}>
                    {isVideoOn ? (
                        // Video ON - show normal camera
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    ) : (
                        // Video OFF - show crossed camera
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V9m12.841 9.091L16.5 19.5m-1.409-1.409c.407-.407.659-.97.659-1.591v-9a2.25 2.25 0 00-2.25-2.25h-9c-.621 0-1.184.252-1.591.659m12.182 12.182L2.909 5.909M1.5 4.5l1.409 1.409" />
                        </svg>
                    )}
                </button>

                {/* Next Button (Primary) */}
                <button
                    onClick={handleNext}
                    style={{
                        padding: '0 1.25rem',
                        height: '48px',
                        borderRadius: '24px',
                        border: 'none',
                        backgroundColor: '#FF6B6B',
                        color: 'white',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                        flexShrink: 0
                    }}
                >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                    Next
                </button>

                {/* End Chat Button */}
                <button
                    onClick={handleEndChat}
                    style={{
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                    title="End chat"
                >
                    <svg width="20" height="20" fill="none" stroke="#EF4444" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Report Button */}
                <button
                    onClick={() => setShowReportModal(true)}
                    style={{
                        width: '48px',
                        height: '48px',
                        minWidth: '48px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.2)',
                        backgroundColor: 'transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}
                    title="Report user"
                >
                    <svg width="18" height="18" fill="none" stroke="#9B9B9B" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                </button>
            </div>

            {/* Report Modal */}
            {showReportModal && (
                <ReportModal
                    onClose={() => setShowReportModal(false)}
                    onSubmit={() => setShowReportModal(false)}
                    partnerId={currentMatch?.partnerId || ''}
                    roomId={currentMatch?.roomId || ''}
                />
            )}

            <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    )
}
