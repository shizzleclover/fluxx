// Real API service - connects to backend
import type {
    User,
    RegisterPayload,
    LoginPayload,
    ApiResponse,
    AuthResponseData,
    ReportPayload
} from '../types'

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://fluxx-production.up.railway.app/api'

// Helper for API requests
async function apiRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
    body?: unknown,
    includeAuth = false
): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    }

    if (includeAuth) {
        const token = localStorage.getItem('fluxx_token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }
    }

    const options: RequestInit = {
        method,
        headers
    }

    if (body) {
        options.body = JSON.stringify(body)
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options)
        const data: ApiResponse<T> = await response.json()

        if (!response.ok) {
            throw new Error(data.message || `Request failed with status ${response.status}`)
        }

        return data
    } catch (error) {
        console.error(`API Error [${method} ${endpoint}]:`, error)
        throw error
    }
}

export const api = {
    // Register new user
    async register(payload: RegisterPayload): Promise<AuthResponseData> {
        const response = await apiRequest<AuthResponseData>(
            '/auth/register',
            'POST',
            payload
        )

        if (response.success && response.data) {
            // Store token
            localStorage.setItem('fluxx_token', response.data.token)
            console.log('[API] Registered user:', payload.email)
            return response.data
        }

        throw new Error(response.message || 'Registration failed')
    },

    // Login
    async login(payload: LoginPayload): Promise<AuthResponseData> {
        const response = await apiRequest<AuthResponseData>(
            '/auth/login',
            'POST',
            payload
        )

        if (response.success && response.data) {
            // Store token
            localStorage.setItem('fluxx_token', response.data.token)
            console.log('[API] Logged in user:', payload.email)
            return response.data
        }

        throw new Error(response.message || 'Login failed')
    },

    // Get current user profile
    async getProfile(): Promise<User> {
        const response = await apiRequest<User>(
            '/auth/me',
            'GET',
            undefined,
            true // Include auth header
        )

        if (response.success && response.data) {
            return response.data
        }

        throw new Error(response.message || 'Failed to get profile')
    },

    // Report user
    async reportUser(payload: ReportPayload): Promise<{ userBanned: boolean; reportCount: number }> {
        const response = await apiRequest<{ userBanned: boolean; reportCount: number }>(
            '/reports',
            'POST',
            payload,
            true // Include auth header
        )

        if (response.success && response.data) {
            console.log('[API] Report submitted')
            return response.data
        }

        throw new Error(response.message || 'Failed to submit report')
    },

    // Logout (clear local storage)
    async logout(): Promise<void> {
        localStorage.removeItem('fluxx_token')
        console.log('[API] User logged out')
    }
}
