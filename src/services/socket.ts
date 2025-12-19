// Real Socket.IO service - connects to backend
import { io, Socket } from 'socket.io-client'
import type { Match } from '../types'

// Get Socket URL from environment (same host as API, without /api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fluxx-production.up.railway.app/api'
const SOCKET_URL = API_BASE_URL.replace('/api', '')

class SocketService {
    private socket: Socket | null = null
    private listeners: Map<string, Set<(...args: unknown[]) => void>> = new Map()

    // Connection state
    isConnected = false
    currentRoomId: string | null = null
    partnerId: string | null = null

    // Connect to server with JWT auth
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            const token = localStorage.getItem('fluxx_token')

            if (!token) {
                reject(new Error('No token available'))
                return
            }

            // Disconnect existing connection
            if (this.socket) {
                this.disconnect()
            }

            console.log('[Socket] Connecting to:', SOCKET_URL)

            this.socket = io(SOCKET_URL, {
                auth: { token },
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            })

            this.socket.on('connect', () => {
                console.log('[Socket] Connected, ID:', this.socket?.id)
                this.isConnected = true
                this.emit('connected')
                resolve()
            })

            this.socket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason)
                this.isConnected = false
                this.emit('disconnected', { reason })
            })

            this.socket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error.message)
                reject(error)
            })

            this.socket.on('error', (data: { message: string }) => {
                console.error('[Socket] Error:', data.message)
                this.emit('error', data)
            })

            // Queue events
            this.socket.on('queue_joined', (data: { position: number; message: string }) => {
                console.log('[Socket] Queue joined:', data.message)
                this.emit('queue_joined', data)
            })

            this.socket.on('queue_left', (data: { message: string }) => {
                console.log('[Socket] Queue left:', data.message)
                this.emit('queue_left', data)
            })

            // Match events
            this.socket.on('match_found', (data: Match & { message?: string }) => {
                console.log('[Socket] Match found:', data)
                this.currentRoomId = data.roomId
                this.partnerId = data.partnerId
                this.emit('match_found', data)
            })

            this.socket.on('match_ended', (data: { reason: string }) => {
                console.log('[Socket] Match ended:', data.reason)
                this.currentRoomId = null
                this.partnerId = null
                this.emit('match_ended', data)
            })

            this.socket.on('chat_ended', (data: { message: string }) => {
                console.log('[Socket] Chat ended:', data.message)
                this.currentRoomId = null
                this.partnerId = null
                this.emit('chat_ended', data)
            })

            // Partner events
            this.socket.on('partner_left', (data: { reason: string }) => {
                console.log('[Socket] Partner left:', data.reason)
                this.emit('partner_left', data)
            })

            this.socket.on('partner_disconnected', (data: { message: string; autoRejoin: boolean }) => {
                console.log('[Socket] Partner disconnected:', data.message)
                this.emit('partner_disconnected', data)
            })

            // WebRTC signaling events
            this.socket.on('webrtc_offer', (data: { offer: RTCSessionDescriptionInit; senderId: string }) => {
                console.log('[Socket] Received WebRTC offer')
                this.emit('webrtc_offer', data)
            })

            this.socket.on('webrtc_answer', (data: { answer: RTCSessionDescriptionInit; senderId: string }) => {
                console.log('[Socket] Received WebRTC answer')
                this.emit('webrtc_answer', data)
            })

            this.socket.on('ice_candidate', (data: { candidate: RTCIceCandidateInit; senderId: string }) => {
                console.log('[Socket] Received ICE candidate')
                this.emit('ice_candidate', data)
            })

            // Ban notification
            this.socket.on('banned', (data: { message: string; banExpiresAt: string; banReason: string }) => {
                console.error('[Socket] User banned:', data.message)
                this.emit('banned', data)
            })

            // Reconnection events
            this.socket.on('reconnect', (attemptNumber: number) => {
                console.log('[Socket] Reconnected after', attemptNumber, 'attempts')
                this.isConnected = true
                this.emit('reconnected', { attemptNumber })
            })

            this.socket.on('reconnect_attempt', (attemptNumber: number) => {
                console.log('[Socket] Reconnection attempt', attemptNumber)
                this.emit('reconnecting', { attemptNumber })
            })

            this.socket.on('reconnect_failed', () => {
                console.error('[Socket] Reconnection failed')
                this.emit('reconnect_failed')
            })
        })
    }

    // Disconnect from server
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect()
            this.socket = null
            this.isConnected = false
            this.currentRoomId = null
            this.partnerId = null
            console.log('[Socket] Disconnected')
        }
    }

    // Queue actions
    joinQueue(): void {
        if (this.socket && this.isConnected) {
            console.log('[Socket] Joining queue...')
            this.socket.emit('join_queue')
        }
    }

    leaveQueue(): void {
        if (this.socket && this.isConnected) {
            console.log('[Socket] Leaving queue...')
            this.socket.emit('leave_queue')
        }
    }

    // Match actions
    nextMatch(): void {
        if (this.socket && this.isConnected) {
            console.log('[Socket] Requesting next match...')
            this.socket.emit('next_match')
        }
    }

    endChat(): void {
        if (this.socket && this.isConnected) {
            console.log('[Socket] Ending chat...')
            this.socket.emit('end_chat')
        }
    }

    // WebRTC signaling
    sendWebRTCOffer(offer: RTCSessionDescriptionInit): void {
        if (this.socket && this.isConnected && this.currentRoomId) {
            console.log('[Socket] Sending WebRTC offer')
            this.socket.emit('webrtc_offer', {
                offer,
                roomId: this.currentRoomId
            })
        }
    }

    sendWebRTCAnswer(answer: RTCSessionDescriptionInit): void {
        if (this.socket && this.isConnected && this.currentRoomId) {
            console.log('[Socket] Sending WebRTC answer')
            this.socket.emit('webrtc_answer', {
                answer,
                roomId: this.currentRoomId
            })
        }
    }

    sendICECandidate(candidate: RTCIceCandidate): void {
        if (this.socket && this.isConnected && this.currentRoomId) {
            console.log('[Socket] Sending ICE candidate')
            this.socket.emit('ice_candidate', {
                candidate,
                roomId: this.currentRoomId
            })
        }
    }

    // Event listener management
    on(event: string, callback: (...args: unknown[]) => void): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)!.add(callback)
    }

    off(event: string, callback: (...args: unknown[]) => void): void {
        const eventListeners = this.listeners.get(event)
        if (eventListeners) {
            eventListeners.delete(callback)
        }
    }

    private emit(event: string, data?: unknown): void {
        const eventListeners = this.listeners.get(event)
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data))
        }
    }
}

// Export singleton instance
export const socketService = new SocketService()
