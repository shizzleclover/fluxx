// WebRTC service for video chat
// Note: In mock mode, we simulate remote streams using local stream mirroring

import { useVideoStore } from '../stores/videoStore'

class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null
    private localStream: MediaStream | null = null

    // Get user media (camera + microphone)
    async getLocalStream(
        videoDeviceId?: string,
        audioDeviceId?: string
    ): Promise<MediaStream> {
        try {
            const constraints: MediaStreamConstraints = {
                video: videoDeviceId
                    ? { deviceId: { exact: videoDeviceId } }
                    : true,
                audio: audioDeviceId
                    ? { deviceId: { exact: audioDeviceId } }
                    : true
            }

            this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
            useVideoStore.getState().setLocalStream(this.localStream)

            console.log('[WebRTC] Got local stream')
            return this.localStream
        } catch (error) {
            console.error('[WebRTC] Failed to get local stream:', error)
            throw error
        }
    }

    // Get available devices
    async getDevices(): Promise<{
        cameras: MediaDeviceInfo[]
        microphones: MediaDeviceInfo[]
    }> {
        const devices = await navigator.mediaDevices.enumerateDevices()

        return {
            cameras: devices.filter(d => d.kind === 'videoinput'),
            microphones: devices.filter(d => d.kind === 'audioinput')
        }
    }

    // Start mock "connection" (simulates receiving remote stream)
    async startMockConnection(): Promise<void> {
        const videoStore = useVideoStore.getState()

        videoStore.setConnectionStatus('connecting')

        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        // In mock mode, create a fake remote stream
        // In production, this would come from WebRTC peer connection
        if (this.localStream) {
            // Create a cloned stream to simulate remote (normally would be peer's stream)
            // For demo purposes, we'll create a canvas-based fake stream
            const fakeRemoteStream = await this.createFakeRemoteStream()
            videoStore.setRemoteStream(fakeRemoteStream)
        }

        videoStore.setConnectionStatus('connected')
        console.log('[WebRTC] Mock connection established')
    }

    // Create a fake remote stream for demo purposes
    private async createFakeRemoteStream(): Promise<MediaStream> {
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 480
        const ctx = canvas.getContext('2d')!

        // Animate the canvas
        let hue = 0
        const animate = () => {
            hue = (hue + 1) % 360
            ctx.fillStyle = `hsl(${hue}, 50%, 30%)`
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            // Draw "Partner Video" text
            ctx.fillStyle = 'white'
            ctx.font = '24px Outfit, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('Partner Video', canvas.width / 2, canvas.height / 2 - 20)
            ctx.font = '16px DM Sans, sans-serif'
            ctx.fillText('(Mock Stream)', canvas.width / 2, canvas.height / 2 + 20)

            requestAnimationFrame(animate)
        }
        animate()

        // @ts-ignore - captureStream exists on canvas
        const stream = canvas.captureStream(30)

        // Add audio track from local stream if available
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0]
            if (audioTrack) {
                stream.addTrack(audioTrack.clone())
            }
        }

        return stream
    }

    // Stop all streams and close connection
    stop(): void {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop())
            this.localStream = null
        }

        if (this.peerConnection) {
            this.peerConnection.close()
            this.peerConnection = null
        }

        useVideoStore.getState().reset()
        console.log('[WebRTC] Stopped')
    }

    // Toggle mute
    toggleMute(): boolean {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0]
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled
                return !audioTrack.enabled // Return muted state
            }
        }
        return false
    }

    // Toggle video
    toggleVideo(): boolean {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled
                return videoTrack.enabled // Return video-on state
            }
        }
        return true
    }
}

// Singleton instance
export const webrtcService = new WebRTCService()
