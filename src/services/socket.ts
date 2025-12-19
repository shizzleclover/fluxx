// Mock Socket service - simulates Socket.IO for matchmaking
import { useMatchStore } from '../stores/matchStore'
import { useVideoStore } from '../stores/videoStore'
import type { Match } from '../types'

type EventCallback = (...args: unknown[]) => void

class MockSocketService {
    private isConnected = false
    private eventListeners: Map<string, EventCallback[]> = new Map()
    private matchTimeout: ReturnType<typeof setTimeout> | null = null

    // Connect to socket (called after auth)
    connect(): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.isConnected = true
                console.log('[Mock Socket] Connected')
                this.emit('connect')
                resolve()
            }, 300)
        })
    }

    // Disconnect
    disconnect(): void {
        this.isConnected = false
        if (this.matchTimeout) {
            clearTimeout(this.matchTimeout)
            this.matchTimeout = null
        }
        console.log('[Mock Socket] Disconnected')
    }

    // Event handling
    on(event: string, callback: EventCallback): void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)!.push(callback)
    }

    off(event: string, callback?: EventCallback): void {
        if (!callback) {
            this.eventListeners.delete(event)
        } else {
            const listeners = this.eventListeners.get(event) || []
            this.eventListeners.set(event, listeners.filter(cb => cb !== callback))
        }
    }

    private emit(event: string, ...args: unknown[]): void {
        const listeners = this.eventListeners.get(event) || []
        listeners.forEach(cb => cb(...args))
    }

    // Join matchmaking queue
    joinQueue(): void {
        if (!this.isConnected) {
            console.error('[Mock Socket] Not connected')
            return
        }

        console.log('[Mock Socket] Joining queue...')
        useMatchStore.getState().setQueueStatus('searching')

        // Simulate finding a match after 2-4 seconds
        const matchDelay = 2000 + Math.random() * 2000

        this.matchTimeout = setTimeout(() => {
            const match: Match = {
                roomId: `room-${crypto.randomUUID().slice(0, 8)}`,
                partnerId: `user-${crypto.randomUUID().slice(0, 8)}`,
                partnerName: `Fluxx_${Math.floor(1000 + Math.random() * 9000)}`
            }

            console.log('[Mock Socket] Match found:', match)
            useMatchStore.getState().setQueueStatus('matched')

            // Short delay before connecting
            setTimeout(() => {
                useMatchStore.getState().setQueueStatus('connecting')
                setTimeout(() => {
                    useMatchStore.getState().setMatch(match)
                    useMatchStore.getState().setQueueStatus('connected')
                    useVideoStore.getState().setConnectionStatus('connected')
                    this.emit('match_found', match)
                }, 500)
            }, 300)
        }, matchDelay)
    }

    // Leave queue
    leaveQueue(): void {
        if (this.matchTimeout) {
            clearTimeout(this.matchTimeout)
            this.matchTimeout = null
        }
        useMatchStore.getState().setQueueStatus('idle')
        console.log('[Mock Socket] Left queue')
    }

    // End current chat
    endChat(): void {
        const matchStore = useMatchStore.getState()
        const videoStore = useVideoStore.getState()

        matchStore.setMatch(null)
        matchStore.setQueueStatus('idle')
        videoStore.setConnectionStatus('disconnected')

        console.log('[Mock Socket] Chat ended')
    }

    // Next match (end current and rejoin queue)
    nextMatch(): void {
        const matchStore = useMatchStore.getState()
        const videoStore = useVideoStore.getState()

        console.log('[Mock Socket] Finding next match...')

        // Clear current match
        matchStore.setMatch(null)
        videoStore.setRemoteStream(null)
        videoStore.setConnectionStatus('disconnected')

        // Automatically rejoin queue
        this.joinQueue()
    }

    // Simulate partner leaving (for testing)
    simulatePartnerLeave(): void {
        const matchStore = useMatchStore.getState()

        if (matchStore.currentMatch) {
            console.log('[Mock Socket] Partner left')
            matchStore.setMatch(null)
            useVideoStore.getState().setRemoteStream(null)
            useVideoStore.getState().setConnectionStatus('disconnected')
            this.emit('partner_left')

            // Auto-rejoin if enabled
            if (matchStore.autoRejoin) {
                console.log('[Mock Socket] Auto-rejoining queue...')
                setTimeout(() => this.joinQueue(), 500)
            }
        }
    }

    // WebRTC signaling (mock - not actually used since we're mocking)
    sendOffer(roomId: string, offer: RTCSessionDescriptionInit): void {
        console.log('[Mock Socket] Sent offer for room:', roomId)
    }

    sendAnswer(roomId: string, answer: RTCSessionDescriptionInit): void {
        console.log('[Mock Socket] Sent answer for room:', roomId)
    }

    sendIceCandidate(roomId: string, candidate: RTCIceCandidateInit): void {
        console.log('[Mock Socket] Sent ICE candidate for room:', roomId)
    }

    get connected(): boolean {
        return this.isConnected
    }
}

// Singleton instance
export const socketService = new MockSocketService()
