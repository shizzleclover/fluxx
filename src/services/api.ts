// Mock API service - simulates backend responses
import type {
    User,
    RegisterPayload,
    LoginPayload,
    VerifyPayload,
    AuthResponse,
    ReportPayload
} from '../types'

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Generate random 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

// Generate display name
const generateDisplayName = () => `Fluxx_${Math.floor(1000 + Math.random() * 9000)}`

// Mock user database (in-memory)
const mockUsers: Map<string, { user: User; password: string; otp?: string }> = new Map()

// Mock banned users
const bannedEmails = new Set<string>()

export const api = {
    // Register new user
    async register(payload: RegisterPayload): Promise<AuthResponse> {
        await delay(800)

        // Check if email already exists
        if (mockUsers.has(payload.email)) {
            throw new Error('Email already registered')
        }

        const otp = generateOtp()
        const user: User = {
            id: crypto.randomUUID(),
            email: payload.email,
            displayName: generateDisplayName(),
            isVerified: false,
            isBanned: false,
            createdAt: new Date().toISOString()
        }

        // Store user with OTP
        mockUsers.set(payload.email, {
            user,
            password: payload.password,
            otp
        })

        // Generate temporary token (not valid until verified)
        const token = btoa(JSON.stringify({ email: payload.email, temp: true }))

        console.log(`[Mock API] Registered user: ${payload.email}, OTP: ${otp}`)

        return { user, token, otp }
    },

    // Verify email with OTP
    async verify(payload: VerifyPayload): Promise<AuthResponse> {
        await delay(600)

        const userData = mockUsers.get(payload.email)

        if (!userData) {
            throw new Error('User not found')
        }

        if (userData.otp !== payload.otp) {
            throw new Error('Invalid OTP')
        }

        // Mark as verified
        userData.user.isVerified = true
        delete userData.otp

        // Generate valid token
        const token = btoa(JSON.stringify({ email: payload.email, verified: true }))

        console.log(`[Mock API] Verified user: ${payload.email}`)

        return { user: userData.user, token }
    },

    // Resend OTP
    async resendOtp(email: string): Promise<{ otp: string }> {
        await delay(500)

        const userData = mockUsers.get(email)

        if (!userData) {
            throw new Error('User not found')
        }

        const otp = generateOtp()
        userData.otp = otp

        console.log(`[Mock API] Resent OTP for: ${email}, New OTP: ${otp}`)

        return { otp }
    },

    // Login
    async login(payload: LoginPayload): Promise<AuthResponse> {
        await delay(700)

        const userData = mockUsers.get(payload.email)

        if (!userData) {
            throw new Error('Invalid email or password')
        }

        if (userData.password !== payload.password) {
            throw new Error('Invalid email or password')
        }

        if (userData.user.isBanned) {
            throw new Error(`Account banned: ${userData.user.banReason}. Expires: ${userData.user.banExpiry}`)
        }

        if (!userData.user.isVerified) {
            // Generate new OTP for unverified users
            const otp = generateOtp()
            userData.otp = otp
            throw new Error('Email not verified. Please verify your email first.')
        }

        const token = btoa(JSON.stringify({ email: payload.email, verified: true }))

        console.log(`[Mock API] Logged in user: ${payload.email}`)

        return { user: userData.user, token }
    },

    // Get current user profile
    async getProfile(): Promise<User> {
        await delay(300)

        // In real app, would decode token and fetch user
        // For mock, return first verified user or throw
        for (const [, userData] of mockUsers) {
            if (userData.user.isVerified) {
                return userData.user
            }
        }

        throw new Error('Not authenticated')
    },

    // Report user
    async reportUser(payload: ReportPayload): Promise<{ success: boolean }> {
        await delay(500)

        console.log(`[Mock API] Report submitted:`, payload)

        return { success: true }
    },

    // Logout
    async logout(): Promise<void> {
        await delay(200)
        console.log(`[Mock API] User logged out`)
    }
}

// For testing: add a pre-verified demo user
mockUsers.set('demo@test.com', {
    user: {
        id: 'demo-user-id',
        email: 'demo@test.com',
        displayName: 'Fluxx_Demo',
        isVerified: true,
        isBanned: false,
        createdAt: new Date().toISOString()
    },
    password: 'demo123'
})
