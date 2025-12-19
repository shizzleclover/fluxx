// User types
export interface User {
    id: string
    email: string
    displayName: string
    isVerified: boolean
    isBanned: boolean
    banReason?: string
    banExpiry?: string
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
    email: string
    password: string
}

export interface LoginPayload {
    email: string
    password: string
}

export interface VerifyPayload {
    email: string
    otp: string
}

export interface AuthResponse {
    user: User
    token: string
    otp?: string // Only returned after registration for demo
}

// Match types
export interface Match {
    roomId: string
    partnerId: string
    partnerName: string
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
    roomId: string
    reason: ReportReason
    details?: string
}

// Socket events
export interface SocketEvents {
    // Client -> Server
    join_queue: () => void
    leave_queue: () => void
    next_match: () => void
    end_chat: () => void
    offer: (data: { roomId: string; offer: RTCSessionDescriptionInit }) => void
    answer: (data: { roomId: string; answer: RTCSessionDescriptionInit }) => void
    ice_candidate: (data: { roomId: string; candidate: RTCIceCandidateInit }) => void

    // Server -> Client
    queue_joined: () => void
    match_found: (match: Match) => void
    partner_left: () => void
    user_banned: (data: { reason: string; expiry: string }) => void
}
