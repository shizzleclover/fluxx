// User types
export interface User {
    id: string
    email: string
    displayName: string
    isVerified: boolean
    isAdmin?: boolean
    isBanned: boolean
    banReason?: string
    banExpiry?: string
    reportCount?: number
    createdAt: string
}

// Auth types
export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
}

export interface RegisterPayload {
    displayName: string
    email: string
    password: string
}

export interface LoginPayload {
    email: string
    password: string
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
    success: boolean
    message?: string
    data?: T
}

export interface AuthResponseData {
    user: User
    token: string
}

// Match types
export interface Match {
    roomId: string
    partnerId: string
    partnerName?: string
}

export type QueueStatus = 'idle' | 'searching' | 'matched' | 'connecting' | 'connected'

export interface MatchState {
    queueStatus: QueueStatus
    currentMatch: Match | null
    isConnected: boolean
}

// Video types
export interface VideoState {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isMuted: boolean
    isVideoOn: boolean
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'failed'
}

// Report types
export type ReportReason =
    | 'inappropriate_content'
    | 'harassment'
    | 'nudity'
    | 'spam'
    | 'other'

export interface ReportPayload {
    reportedUserId: string
    reason: ReportReason
    additionalDetails?: string
}

// Socket events
export interface SocketEvents {
    // Client -> Server
    join_queue: () => void
    leave_queue: () => void
    next_match: () => void
    end_chat: () => void
    webrtc_offer: (data: { roomId: string; offer: RTCSessionDescriptionInit }) => void
    webrtc_answer: (data: { roomId: string; answer: RTCSessionDescriptionInit }) => void
    ice_candidate: (data: { roomId: string; candidate: RTCIceCandidateInit }) => void

    // Server -> Client
    queue_joined: (data: { position: number; message: string }) => void
    queue_left: (data: { message: string }) => void
    match_found: (match: Match) => void
    match_ended: (data: { reason: string }) => void
    chat_ended: (data: { message: string }) => void
    partner_left: (data: { reason: string }) => void
    partner_disconnected: (data: { message: string; autoRejoin: boolean }) => void
    banned: (data: { message: string; banExpiresAt: string; banReason: string }) => void
    error: (data: { message: string }) => void
}
