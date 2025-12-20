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

    // ICE Candidate Queue
    private iceCandidateQueue: RTCIceCandidateInit[] = []
    private isRemoteDescriptionSet = false

    // Callbacks
    onLocalStream: ((stream: MediaStream) => void) | null = null
    onRemoteStream: ((stream: MediaStream) => void) | null = null
    onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null
    onICEStateChange: ((state: RTCIceConnectionState) => void) | null = null

    constructor() {
        console.log('[WebRTC] 🛠️ Service initialized')
    }

    // Get local video/audio stream
    async getLocalStream(videoEnabled = true, audioEnabled = true): Promise<MediaStream> {
        try {
            console.log('[WebRTC] 🎥 Requesting local stream...')
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

            console.log(`[WebRTC] ✅ Local stream started. Tracks: ${this.localStream.getTracks().length}`)
            this.localStream.getTracks().forEach(t => {
                console.log(`[WebRTC]   - ${t.kind}: enabled=${t.enabled}, state=${t.readyState}, id=${t.id}`)
            })

            if (this.onLocalStream) {
                this.onLocalStream(this.localStream)
            }

            return this.localStream
        } catch (error) {
            console.error('[WebRTC] ❌ Failed to get local stream:', error)
            throw error
        }
    }

    // Get available media devices
    async getDevices(): Promise<MediaDeviceInfo[]> {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            return devices
        } catch (error) {
            console.error('[WebRTC] ❌ Failed to enumerate devices:', error)
            return []
        }
    }

    // Create peer connection (called when match is found)
    async createPeerConnection(isInitiator: boolean): Promise<void> {
        try {
            if (!this.localStream) {
                console.log('[WebRTC] ⚠️ No local stream, fetching now...')
                await this.getLocalStream()
            }

            // Reset state
            this.iceCandidateQueue = []
            this.isRemoteDescriptionSet = false
            this.remoteStream = new MediaStream()
            this.remoteStreamReference = null
            this.remoteStreamSetup = false

            // 1. Create Peer Connection
            console.log('[WebRTC] 🛠️ Creating RTCPeerConnection')
            this.peerConnection = new RTCPeerConnection(rtcConfig)

            // 2. Setup Event Handlers (BEFORE adding tracks or signaling)
            this.setupPeerConnectionHandlers()

            // 3. Add Local Tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    console.log(`[WebRTC] 📤 Adding local ${track.kind} track to PeerConnection`)
                    if (this.peerConnection && this.localStream) {
                        this.peerConnection.addTrack(track, this.localStream)
                    }
                })
            }

            // 4. Setup Signaling Handlers
            this.setupSignalingHandlers()

            // 5. Create Offer (if initiator)
            if (isInitiator) {
                console.log('[WebRTC] 🚀 Initiating connection (creating offer)')
                await this.createOffer()
            } else {
                console.log('[WebRTC] 👂 Waiting for offer...')
            }

        } catch (error) {
            console.error('[WebRTC] ❌ Error in createPeerConnection:', error)
        }
    }

    // Setup all RTCPeerConnection event handlers
    private setupPeerConnectionHandlers(): void {
        if (!this.peerConnection) return

        // Handle remote tracks
        this.peerConnection.ontrack = (event) => {
            console.log(`[WebRTC] 🎥 Received remote ${event.track.kind} track`)
            console.log(`[WebRTC]    - Stream ID: ${event.streams[0]?.id || 'N/A'}`)
            console.log(`[WebRTC]    - Track ID: ${event.track.id}`)
            console.log(`[WebRTC]    - Track enabled: ${event.track.enabled}`)
            console.log(`[WebRTC]    - Track state: ${event.track.readyState}`)

            let streamToUse: MediaStream | null = null

            // Handle event.streams (preferred)
            if (event.streams && event.streams.length > 0) {
                streamToUse = event.streams[0]
                if (!this.remoteStreamReference) {
                    this.remoteStreamReference = streamToUse
                }
                console.log(`[WebRTC] ✅ Using stream from event (${streamToUse.getTracks().length} tracks)`)
            }
            // Fallback: Handle event.track
            else if (event.track) {
                if (!this.remoteStream) this.remoteStream = new MediaStream()

                // Remove existing track of same kind if exists
                const existingTrack = this.remoteStream.getTracks().find(t => t.kind === event.track.kind)
                if (existingTrack) {
                    console.log(`[WebRTC] ⚠️ Replacing existing ${existingTrack.kind} track`)
                    this.remoteStream.removeTrack(existingTrack)
                }

                this.remoteStream.addTrack(event.track)
                streamToUse = this.remoteStream
                if (!this.remoteStreamReference) {
                    this.remoteStreamReference = streamToUse
                }
                console.log(`[WebRTC] ✅ Added individual track to stream (${this.remoteStream.getTracks().length} tracks)`)
            }

            // CRITICAL: Enable track immediately
            event.track.enabled = true

            // Handlers for track mute/unmute
            event.track.onmute = () => console.warn(`[WebRTC] 😶 Remote ${event.track.kind} track muted`)
            event.track.onunmute = () => console.log(`[WebRTC] 🔊 Remote ${event.track.kind} track unmuted`)
            event.track.onended = () => console.warn(`[WebRTC] ⏹️ Remote ${event.track.kind} track ended`)

            // CRITICAL: Call onRemoteStream only once per stream
            if (streamToUse && !this.remoteStreamSetup) {
                this.remoteStreamSetup = true
                console.log('[WebRTC] 🎥 Remote stream assigned (one-time setup)')
                if (this.onRemoteStream) {
                    this.onRemoteStream(this.remoteStreamReference || streamToUse)
                }
            }
        }

        // Handle ICE candidates
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('[WebRTC] 🧊 Generated ICE candidate')
                socketService.sendICECandidate(event.candidate)
            } else {
                console.log('[WebRTC] 🧊 All ICE candidates gathered')
            }
        }

        // Connection State Monitoring
        this.peerConnection.onconnectionstatechange = () => {
            const state = this.peerConnection?.connectionState || 'unknown'
            console.log(`[WebRTC] 🔄 Connection state changed: ${state}`)

            if (this.onConnectionStateChange) {
                this.onConnectionStateChange(state as RTCPeerConnectionState)
            }

            if (state === 'connected') {
                console.log('[WebRTC] ✅ Peer Connection ESTABLISHED')
            } else if (state === 'failed') {
                console.error('[WebRTC] ❌ Peer Connection FAILED')
                this.restartICE()
            }
        }

        this.peerConnection.oniceconnectionstatechange = () => {
            const state = this.peerConnection?.iceConnectionState || 'unknown'
            console.log(`[WebRTC] ❄️ ICE Connection state changed: ${state}`)

            if (this.onICEStateChange) {
                this.onICEStateChange(state as RTCIceConnectionState)
            }

            if (state === 'failed') {
                console.error('[WebRTC] ❌ ICE Connection FAILED')
                this.restartICE()
            }
        }

        this.peerConnection.onicegatheringstatechange = () => {
            console.log(`[WebRTC] 🧺 ICE Gathering state: ${this.peerConnection?.iceGatheringState}`)
        }

        this.peerConnection.onsignalingstatechange = () => {
            console.log(`[WebRTC] 🚦 Signaling state changed: ${this.peerConnection?.signalingState}`)
        }
    }

    // Set up socket handlers for WebRTC signaling
    private setupSignalingHandlers(): void {
        socketService.on('webrtc_offer', async (data: unknown) => {
            console.log('[WebRTC] 📥 Received OFFER')
            const { offer } = data as { offer: RTCSessionDescriptionInit }
            await this.handleOffer(offer)
        })

        socketService.on('webrtc_answer', async (data: unknown) => {
            console.log('[WebRTC] 📥 Received ANSWER')
            const { answer } = data as { answer: RTCSessionDescriptionInit }
            await this.handleAnswer(answer)
        })

        socketService.on('ice_candidate', async (data: unknown) => {
            console.log('[WebRTC] 📥 Received ICE CANDIDATE')
            const { candidate } = data as { candidate: RTCIceCandidateInit }
            await this.handleICECandidate(candidate)
        })
    }

    // Create and send offer (initiator)
    private async createOffer(): Promise<void> {
        if (!this.peerConnection) return

        try {
            console.log('[WebRTC] 📝 Creating offer...')
            const offer = await this.peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            })

            console.log('[WebRTC] 💿 Setting local description (offer)')
            await this.peerConnection.setLocalDescription(offer)

            console.log('[WebRTC] 📤 Sending offer to peer')
            socketService.sendWebRTCOffer(offer)
        } catch (error) {
            console.error('[WebRTC] ❌ Error creating offer:', error)
        }
    }

    // Handle incoming offer (receiver)
    private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
        // If no peer connection, create one now (responder)
        if (!this.peerConnection) {
            console.log('[WebRTC] 🆕 Creating fresh PeerConnection for received offer')
            await this.createPeerConnection(false)
        }

        if (!this.peerConnection) {
            console.error('[WebRTC] ❌ PeerConnection creation failed in handleOffer')
            return
        }

        // Check signaling state
        if (this.peerConnection.signalingState !== 'stable') {
            console.warn(`[WebRTC] ⚠️ Signaling state is ${this.peerConnection.signalingState}, expected 'stable'. Rolling back?`)
            // If we are colliding, we might need to rollback or ignore. 
            // For now, let's proceed but warn.
            await Promise.all([
                this.peerConnection.setLocalDescription({ type: "rollback" }),
                this.peerConnection.setRemoteDescription(offer)
            ]).catch(e => console.error("Rollback failed", e))
        } else {
            try {
                console.log('[WebRTC] 💿 Setting remote description (offer)')
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
                this.isRemoteDescriptionSet = true

                // Process queued ICE candidates
                this.processIceCandidateQueue()

                console.log('[WebRTC] 📝 Creating answer...')
                const answer = await this.peerConnection.createAnswer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                })

                console.log('[WebRTC] 💿 Setting local description (answer)')
                await this.peerConnection.setLocalDescription(answer)

                console.log('[WebRTC] 📤 Sending answer to peer')
                socketService.sendWebRTCAnswer(answer)
            } catch (error) {
                console.error('[WebRTC] ❌ Error handling offer:', error)
            }
        }
    }

    // Handle incoming answer (initiator)
    private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
        if (!this.peerConnection) return

        console.log(`[WebRTC] Current signaling state before answer: ${this.peerConnection.signalingState}`)

        try {
            if (this.peerConnection.signalingState === 'have-local-offer') {
                console.log('[WebRTC] 💿 Setting remote description (answer)')
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
                this.isRemoteDescriptionSet = true

                // Process queued ICE candidates
                this.processIceCandidateQueue()

                console.log('[WebRTC] ✅ Remote description set successfully!')
            } else if (this.peerConnection.signalingState === 'stable') {
                console.log('[WebRTC] ⚠️ Connection already stable, ignoring answer')
            } else {
                console.warn(`[WebRTC] ⚠️ Unexpected signaling state: ${this.peerConnection.signalingState}`)
            }
        } catch (error) {
            console.error('[WebRTC] ❌ Error handling answer:', error)
        }
    }

    // Handle incoming ICE candidate
    private async handleICECandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.peerConnection) return

        try {
            if (this.isRemoteDescriptionSet) {
                console.log('[WebRTC] 🧊 Adding ICE candidate directly')
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            } else {
                console.log('[WebRTC] ⏳ Queueing ICE candidate (Remote description not set)')
                this.iceCandidateQueue.push(candidate)
            }
        } catch (error) {
            console.error('[WebRTC] ❌ Error adding ICE candidate:', error)
        }
    }

    // Process queued ICE candidates
    private async processIceCandidateQueue(): Promise<void> {
        if (!this.peerConnection || this.iceCandidateQueue.length === 0) return

        console.log(`[WebRTC] 🧊 Processing ${this.iceCandidateQueue.length} queued ICE candidates`)

        for (const candidate of this.iceCandidateQueue) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            } catch (error) {
                console.error('[WebRTC] ❌ Error adding queued ICE candidate:', error)
            }
        }

        this.iceCandidateQueue = []
    }

    // Restart ICE on failure
    private restartICE(): void {
        if (this.peerConnection) {
            try {
                console.log('[WebRTC] ♻️ Restarting ICE...')
                this.peerConnection.restartIce()
            } catch (error) {
                console.error('[WebRTC] ❌ Error restarting ICE:', error)
            }
        }
    }

    // Toggle video track
    toggleVideo(enabled: boolean): void {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled
                console.log(`[WebRTC] 🎥 Local video ${enabled ? 'enabled' : 'disabled'}`)
            })
        }
    }

    // Toggle audio track
    toggleMute(muted: boolean): void {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = !muted
                console.log(`[WebRTC] 🎤 Local audio ${!muted ? 'unmuted' : 'muted'}`)
            })
        }
    }

    // Stop local stream
    stopLocalStream(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop()
                console.log(`[WebRTC] ⏹️ Stopped local track: ${track.kind}`)
            })
            this.localStream = null
        }
    }

    // Clean up everything
    cleanup(): void {
        console.log('[WebRTC] 🧹 Cleanup initiated')

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
        this.iceCandidateQueue = []
        this.isRemoteDescriptionSet = false

        console.log('[WebRTC] ✅ Cleanup complete')
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
