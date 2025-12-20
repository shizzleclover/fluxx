// Real WebRTC service - peer connections with STUN/TURN
import { socketService } from './socket'

// WebRTC configuration with STUN/TURN servers
const rtcConfig: RTCConfiguration = {
    iceServers: [
        // STUN servers (for NAT traversal)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        // TURN servers (for relay when direct connection fails)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10
}

class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null
    private localStream: MediaStream | null = null
    private remoteStream: MediaStream | null = null
    // CRITICAL: Keep reference to prevent garbage collection
    private remoteStreamReference: MediaStream | null = null
    private remoteStreamSetup = false

    // Callbacks
    onLocalStream: ((stream: MediaStream) => void) | null = null
    onRemoteStream: ((stream: MediaStream) => void) | null = null
    onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null
    onICEStateChange: ((state: RTCIceConnectionState) => void) | null = null

    // Get local video/audio stream
    async getLocalStream(videoEnabled = true, audioEnabled = true): Promise<MediaStream> {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: videoEnabled ? {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } : false,
                audio: audioEnabled ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } : false
            })

            console.log('[WebRTC] Local stream started')

            if (this.onLocalStream) {
                this.onLocalStream(this.localStream)
            }

            return this.localStream
        } catch (error) {
            console.error('[WebRTC] Failed to get local stream:', error)
            throw error
        }
    }

    // Get available media devices
    async getDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            return devices
        } catch (error) {
            console.error('[WebRTC] Failed to enumerate devices:', error)
            return []
        }
    }

    // Create peer connection (called when match is found)
    async createPeerConnection(isInitiator: boolean): Promise<void> {
        if (!this.localStream) {
            await this.getLocalStream()
        }

        // CRITICAL: Initialize remote stream early
        this.remoteStream = new MediaStream()
        this.remoteStreamReference = null
        this.remoteStreamSetup = false

        // Create peer connection
        this.peerConnection = new RTCPeerConnection(rtcConfig)

        // Add local tracks to peer connection BEFORE creating offer
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                console.log(`[WebRTC] Adding local ${track.kind} track`)
                this.peerConnection!.addTrack(track, this.localStream!)
            })
        }

        // CRITICAL: Handle remote tracks properly
        this.peerConnection.ontrack = (event) => {
            console.log(`[WebRTC] Received remote ${event.track.kind} track`)

            let streamToUse: MediaStream | null = null

            // Handle event.streams (preferred)
            if (event.streams && event.streams.length > 0) {
                streamToUse = event.streams[0]
                if (!this.remoteStreamReference) {
                    this.remoteStreamReference = streamToUse
                }
                console.log(`[WebRTC] Using stream from event (${streamToUse.getTracks().length} tracks)`)
            }
            // Fallback: Handle event.track
            else if (event.track) {
                // Remove existing track of same kind
                const existingTrack = this.remoteStream!.getTracks().find(t => t.kind === event.track.kind)
                if (existingTrack) {
                    this.remoteStream!.removeTrack(existingTrack)
                    existingTrack.stop()
                }
                this.remoteStream!.addTrack(event.track)
                streamToUse = this.remoteStream
                if (!this.remoteStreamReference) {
                    this.remoteStreamReference = streamToUse
                }
                console.log(`[WebRTC] Added track to stream (${this.remoteStream!.getTracks().length} tracks)`)
            }

            // CRITICAL: Enable track immediately
            event.track.enabled = true

            // CRITICAL: Call onRemoteStream only once
            if (streamToUse && !this.remoteStreamSetup) {
                this.remoteStreamSetup = true
                console.log('[WebRTC] Remote stream assigned (one-time setup)')
                if (this.onRemoteStream) {
                    this.onRemoteStream(this.remoteStreamReference || streamToUse)
                }
            }

            // Monitor track state
            event.track.onmute = () => {
                console.warn(`[WebRTC] Remote ${event.track.kind} track muted`)
                // Re-enable track
                event.track.enabled = true
            }

            event.track.onunmute = () => {
                console.log(`[WebRTC] Remote ${event.track.kind} track unmuted`)
            }

            event.track.onended = () => {
                console.log(`[WebRTC] Remote ${event.track.kind} track ended`)
            }
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] Sending ICE candidate')
                socketService.sendICECandidate(event.candidate)
            } else {
                console.log('[WebRTC] All ICE candidates gathered')
            }
        }

        // Handle connection state changes
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState || 'disconnected'
            console.log('[WebRTC] Connection state:', state)

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(state as RTCPeerConnectionState)
            }

            if (state === 'connected') {
                console.log('[WebRTC] ✅ Connected!')
            } else if (state === 'failed') {
                console.error('[WebRTC] ❌ Connection failed')
                this.restartICE()
            }
        }

        // Handle ICE connection state
        this.peerConnection.oniceconnectionstatechange = () => {
            const state = this.peerConnection?.iceConnectionState || 'disconnected'
            console.log('[WebRTC] ICE state:', state)

            if (this.onICEStateChange) {
                this.onICEStateChange(state as RTCIceConnectionState)
            }

            if (state === 'connected' || state === 'completed') {
                console.log('[WebRTC] ✅ ICE connection successful!')
                // Log receiver info for debugging
                const receivers = this.peerConnection?.getReceivers() || []
                console.log(`[WebRTC] Found ${receivers.length} receiver(s)`)
                receivers.forEach((receiver, idx) => {
                    const track = receiver.track
                    console.log(`[WebRTC] Receiver ${idx}: ${track.kind}, enabled=${track.enabled}, muted=${track.muted}`)
                })
            }

            if (state === 'failed') {
                console.error('[WebRTC] ❌ ICE failed')
                this.restartICE()
            }
        }

        // Set up socket event handlers for signaling
        this.setupSignalingHandlers()

        // If initiator, create and send offer
        if (isInitiator) {
            await this.createOffer()
        }
    }

    // Set up socket handlers for WebRTC signaling
    private setupSignalingHandlers(): void {
        socketService.on('webrtc_offer', async (data: unknown) => {
            const { offer } = data as { offer: RTCSessionDescriptionInit }
            await this.handleOffer(offer)
        })

        socketService.on('webrtc_answer', async (data: unknown) => {
            const { answer } = data as { answer: RTCSessionDescriptionInit }
            await this.handleAnswer(answer)
        })

        socketService.on('ice_candidate', async (data: unknown) => {
            const { candidate } = data as { candidate: RTCIceCandidateInit }
            await this.handleICECandidate(candidate)
        })
    }

    // Create and send offer (initiator)
    private async createOffer(): Promise<void> {
        if (!this.peerConnection) return

        try {
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            })

            await this.peerConnection.setLocalDescription(offer)
            socketService.sendWebRTCOffer(offer)
            console.log('[WebRTC] Offer created and sent')
        } catch (error) {
            console.error('[WebRTC] Error creating offer:', error)
        }
    }

    // Handle incoming offer (receiver)
    private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) {
            // Create peer connection if it doesn't exist
            await this.createPeerConnection(false)
        }

        if (!this.peerConnection) return

        // Check signaling state
        if (this.peerConnection.signalingState !== 'stable') {
            console.log('[WebRTC] Signaling state not stable, current:', this.peerConnection.signalingState)
            return
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
            console.log('[WebRTC] Remote description set (offer)')

            const answer = await this.peerConnection.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            })

            await this.peerConnection.setLocalDescription(answer)
            socketService.sendWebRTCAnswer(answer)
            console.log('[WebRTC] Answer created and sent')
        } catch (error) {
            console.error('[WebRTC] Error handling offer:', error)
        }
    }

    // Handle incoming answer (initiator)
    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) return

        // CRITICAL: Check signaling state before setting remote description
        const currentState = this.peerConnection.signalingState
        console.log('[WebRTC] Current signaling state:', currentState)

        if (currentState === 'stable') {
            console.log('[WebRTC] Connection already stable - may be connected via ICE')
            // Check if we already have remote tracks
            const receivers = this.peerConnection.getReceivers()
            if (receivers.length > 0) {
                console.log(`[WebRTC] Already have ${receivers.length} remote track(s), connection likely established`)
            }
            return
        }

        if (currentState !== 'have-local-offer') {
            console.warn('[WebRTC] Unexpected signaling state:', currentState)
            return
        }

        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
            console.log('[WebRTC] Answer received, connection established')
        } catch (error) {
            console.error('[WebRTC] Error handling answer:', error)
        }
    }

    // Handle incoming ICE candidate
    private async handleICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) return

        try {
            if (candidate) {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
                console.log('[WebRTC] ICE candidate added')
            } else {
                console.log('[WebRTC] End of ICE candidates')
            }
        } catch (error) {
            console.error('[WebRTC] Error adding ICE candidate:', error)
        }
    }

    // Restart ICE on failure
    private restartICE(): void {
        if (this.peerConnection) {
            try {
                this.peerConnection.restartIce()
                console.log('[WebRTC] ICE restart initiated')
            } catch (error) {
                console.error('[WebRTC] Error restarting ICE:', error)
            }
        }
    }

    // Toggle video track
    toggleVideo(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled
            })
            console.log('[WebRTC] Video toggled:', enabled)
        }
    }

    // Toggle audio track
    toggleMute(muted: boolean): void {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !muted
            })
            console.log('[WebRTC] Audio toggled:', !muted)
        }
    }

    // Stop local stream
    stopLocalStream(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop()
            })
            this.localStream = null
            console.log('[WebRTC] Local stream stopped')
        }
    }

    // Clean up everything
    cleanup(): void {
        // Remove socket listeners
        socketService.off('webrtc_offer', () => { })
        socketService.off('webrtc_answer', () => { })
        socketService.off('ice_candidate', () => { })

        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.close()
            this.peerConnection = null
        }

        // Clear remote stream references
        if (this.remoteStreamReference) {
            this.remoteStreamReference.getTracks().forEach(track => track.stop())
            this.remoteStreamReference = null
        }
        this.remoteStream = null
        this.remoteStreamSetup = false

        console.log('[WebRTC] Cleaned up')
    }

    // Full stop (including local stream)
    stop(): void {
        this.cleanup()
        this.stopLocalStream()
    }

    // Get current local stream
    getStream(): MediaStream | null {
        return this.localStream
    }

    // Get current remote stream
    getRemoteStream(): MediaStream | null {
        return this.remoteStreamReference || this.remoteStream
    }
}

// Export singleton instance
export const webrtcService = new WebRTCService()
