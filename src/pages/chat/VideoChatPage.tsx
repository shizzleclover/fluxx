import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMatchStore } from '../../stores/matchStore'
import { useVideoStore } from '../../stores/videoStore'
import { socketService } from '../../services/socket'
import { webrtcService } from '../../services/webrtc'
import ReportModal from '../../components/ReportModal'

export default function VideoChatPage() {
    const navigate = useNavigate()
    const { currentMatch, queueStatus, setQueueStatus, reset: resetMatch } = useMatchStore()
    const {
        isMuted,
        isVideoOn,
        connectionStatus,
        setLocalStream,
        setRemoteStream,
        setConnectionStatus,
        toggleMute,
        toggleVideo,
        reset: resetVideo
    } = useVideoStore()

    const localVideoRef = useRef<HTMLVideoElement>(null)
    const remoteVideoRef = useRef<HTMLVideoElement>(null)
    const [showReportModal, setShowReportModal] = useState(false)
    const [partnerLeft, setPartnerLeft] = useState(false)

    // Setup WebRTC callbacks and create peer connection when match is found
    useEffect(() => {
        if (!currentMatch) return

        let remoteVideoSetup = false

        const playRemoteVideo = async () => {
            const video = remoteVideoRef.current
            if (!video) {
                console.error('[VideoChatPage] ❌ Remote video ref is null')
                return
            }

            if (!video.srcObject) {
                console.warn('[VideoChatPage] ⚠️ Remote video stream is missing (srcObject is null)')
                return
            }

            console.log('[VideoChatPage] 🎥 Attempting to play remote video...')

            // Ensure not muted for audio
            video.muted = false

            try {
                await video.play()
                console.log('[VideoChatPage] ✅ Remote video is PLAYING!')
                console.log(`[VideoChatPage] 📏 Video dimensions: ${video.videoWidth}x${video.videoHeight}`)
            } catch (error) {
                console.warn('[VideoChatPage] ❌ Play failed:', error)
                // Retry play after delay
                setTimeout(() => {
                    console.log('[VideoChatPage] 🔄 Retrying play...')
                    if (video.srcObject) {
                        video.play().catch(e => console.error('[VideoChatPage] ❌ Retry play failed:', e))
                    }
                }, 1000)
            }
        }

        const setupWebRTC = async () => {
            console.log('[VideoChatPage] 🚀 Starting WebRTC setup for room:', currentMatch.roomId)
            setConnectionStatus('connecting')
            setQueueStatus('connecting')

            // Setup callbacks
            webrtcService.onLocalStream = (stream) => {
                console.log('[VideoChatPage] 🎥 Local stream received')
                setLocalStream(stream)
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream
                }
            }

            webrtcService.onRemoteStream = (stream) => {
                console.log(`[VideoChatPage] 🎥 Remote stream received with ${stream.getTracks().length} tracks`)
                setRemoteStream(stream)

                // CRITICAL: Set srcObject only once
                if (remoteVideoRef.current && !remoteVideoSetup) {
                    remoteVideoSetup = true

                    console.log('[VideoChatPage] 🔗 Assigning remote stream to video element')
                    remoteVideoRef.current.srcObject = stream

                    // Attach event listeners for debugging
                    remoteVideoRef.current.onloadedmetadata = () => console.log('[VideoChatPage] 🎞️ Remote video metadata loaded')
                    remoteVideoRef.current.onloadeddata = () => console.log('[VideoChatPage] 🎞️ Remote video data loaded')
                    remoteVideoRef.current.oncanplay = () => {
                        console.log('[VideoChatPage] ✅ Remote video CAN PLAY')
                        playRemoteVideo()
                    }
                    remoteVideoRef.current.onplay = () => console.log('[VideoChatPage] ▶️ Remote video started playing')
                    remoteVideoRef.current.onpause = () => console.log('[VideoChatPage] ⏸️ Remote video paused')
                    remoteVideoRef.current.onerror = (e) => console.error('[VideoChatPage] ❌ Remote video error:', e)

                    // Force load
                    remoteVideoRef.current.load()
                }
            }

            webrtcService.onConnectionStateChange = (state) => {
                console.log(`[VideoChatPage] 📶 Connection state update: ${state}`)
                if (state === 'connected') {
                    setConnectionStatus('connected')
                    setQueueStatus('connected')
                    // Force play when connection is established
                    setTimeout(() => playRemoteVideo(), 500)
                } else if (state === 'failed' || state === 'disconnected') {
                    setConnectionStatus('failed')
                }
            }

            // Create peer connection (initiator sends offer)
            await webrtcService.createPeerConnection(true)
        }

        setupWebRTC()

        return () => {
            console.log('[VideoChatPage] 🧹 Cleaning up WebRTC setup')
            webrtcService.onLocalStream = null
            webrtcService.onRemoteStream = null
            webrtcService.onConnectionStateChange = null
            remoteVideoSetup = false
        }
    }, [currentMatch, setConnectionStatus, setQueueStatus, setLocalStream, setRemoteStream])

    // Listen for partner leaving
    useEffect(() => {
        const handlePartnerLeft = () => {
            console.log('[VideoChatPage] Partner left')
            setPartnerLeft(true)
            webrtcService.cleanup()
            setConnectionStatus('disconnected')

            // Auto-rejoin queue after delay
            setTimeout(() => {
                setPartnerLeft(false)
                setQueueStatus('searching')
            }, 2000)
        }

        const handlePartnerDisconnected = () => {
            console.log('[VideoChatPage] Partner disconnected')
            setPartnerLeft(true)
            webrtcService.cleanup()
            setConnectionStatus('disconnected')
        }

        const handleMatchEnded = () => {
            console.log('[VideoChatPage] Match ended')
            webrtcService.cleanup()
            setConnectionStatus('disconnected')
        }

        const handleNewMatchFound = (data: unknown) => {
            const matchData = data as { roomId: string; partnerId: string }
            console.log('[VideoChatPage] New match found:', matchData)
            setPartnerLeft(false)
        }

        socketService.on('partner_left', handlePartnerLeft)
        socketService.on('partner_disconnected', handlePartnerDisconnected)
        socketService.on('match_ended', handleMatchEnded)
        socketService.on('match_found', handleNewMatchFound)

        return () => {
            socketService.off('partner_left', handlePartnerLeft)
            socketService.off('partner_disconnected', handlePartnerDisconnected)
            socketService.off('match_ended', handleMatchEnded)
            socketService.off('match_found', handleNewMatchFound)
        }
    }, [setConnectionStatus, setQueueStatus])

    // Redirect if no match and idle
    useEffect(() => {
        if (!currentMatch && queueStatus === 'idle') {
            navigate('/app')
        }
    }, [currentMatch, queueStatus, navigate])

    // Get local stream from webrtc service
    const localStream = webrtcService.getStream()
    const remoteStream = webrtcService.getRemoteStream()

    // Display local video
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream
        }
    }, [localStream])

    // Display remote video
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream
        }
    }, [remoteStream])

    const handleNext = () => {
        setPartnerLeft(false)
        webrtcService.cleanup()
        socketService.nextMatch()
        setQueueStatus('searching')
    }

    const handleEndChat = () => {
        socketService.endChat()
        webrtcService.stop()
        resetMatch()
        resetVideo()
        navigate('/app')
    }

    const handleToggleMute = () => {
        const newMuted = !isMuted
        toggleMute()
        webrtcService.toggleMute(newMuted)
    }

    const handleToggleVideo = () => {
        const newVideoOn = !isVideoOn
        toggleVideo()
        webrtcService.toggleVideo(newVideoOn)
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
                    {/* Debug: Manual Play Button */}
                    {isConnected && remoteStream && (
                        <button
                            onClick={() => {
                                console.log('[VideoChatPage] 🖱️ Manual play clicked')
                                remoteVideoRef.current?.play()
                                    .then(() => console.log('[VideoChatPage] ✅ Manual play success'))
                                    .catch(e => console.error('[VideoChatPage] ❌ Manual play error:', e))
                            }}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                zIndex: 1000,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                color: 'white',
                                border: '1px solid white',
                                padding: '5px 10px',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            ▶️ Force Play
                        </button>
                    )}
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

                {/* Local Video (Picture-in-Picture) */}
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
                                transform: 'scaleX(-1)'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#2D2D2D'
                        }}>
                            <svg width="24" height="24" fill="none" stroke="#6B6B6B" strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>
            </div>

            {/* Control Bar */}
            <div style={{
                padding: '12px 16px',
                backgroundColor: 'rgba(0,0,0,0.8)',
                borderTop: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                }}>
                    {/* Mute Button */}
                    <button
                        onClick={handleToggleMute}
                        style={controlBtnStyle(!isMuted)}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        )}
                    </button>

                    {/* Video Toggle Button */}
                    <button
                        onClick={handleToggleVideo}
                        style={controlBtnStyle(isVideoOn)}
                        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoOn ? (
                            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        ) : (
                            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                <line x1="2" y1="2" x2="22" y2="22" stroke="white" strokeWidth="2" />
                            </svg>
                        )}
                    </button>

                    {/* Next Button */}
                    <button
                        onClick={handleNext}
                        style={{
                            ...controlBtnStyle(true),
                            backgroundColor: '#FF6B6B'
                        }}
                        title="Next match"
                    >
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* End Chat Button */}
                    <button
                        onClick={handleEndChat}
                        style={controlBtnStyle(false, true)}
                        title="End chat"
                    >
                        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Report Button */}
                    <button
                        onClick={() => setShowReportModal(true)}
                        style={{
                            ...controlBtnStyle(true),
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }}
                        title="Report user"
                    >
                        <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2m0 0h17M9 7h1m-1 4h1" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Report Modal */}
            {showReportModal && currentMatch && (
                <ReportModal
                    reportedUserId={currentMatch.partnerId}
                    roomId={currentMatch.roomId}
                    onClose={() => setShowReportModal(false)}
                    onSuccess={() => {
                        setShowReportModal(false)
                        handleNext()
                    }}
                />
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}
