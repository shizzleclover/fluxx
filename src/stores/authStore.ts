import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
    user: User | null
    token: string | null
    pendingOtp: string | null
    pendingEmail: string | null
    isLoading: boolean
    error: string | null

    // Actions
    setUser: (user: User) => void
    setToken: (token: string) => void
    setPendingVerification: (email: string, otp: string) => void
    clearPendingVerification: () => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    logout: () => void
    isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            pendingOtp: null,
            pendingEmail: null,
            isLoading: false,
            error: null,

            setUser: (user) => set({ user, error: null }),

            setToken: (token) => set({ token }),

            setPendingVerification: (email, otp) => set({
                pendingEmail: email,
                pendingOtp: otp
            }),

            clearPendingVerification: () => set({
                pendingEmail: null,
                pendingOtp: null
            }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            logout: () => set({
                user: null,
                token: null,
                pendingOtp: null,
                pendingEmail: null,
                error: null
            }),

            isAuthenticated: () => {
                const state = get()
                return !!state.token && !!state.user?.isVerified
            }
        }),
        {
            name: 'fluxx-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token
            })
        }
    )
)
