import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthStore {
    user: User | null
    token: string | null
    isLoading: boolean
    error: string | null

    // Actions
    setUser: (user: User) => void
    setToken: (token: string) => void
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
            isLoading: false,
            error: null,

            setUser: (user) => set({ user, error: null }),

            setToken: (token) => set({ token }),

            setLoading: (isLoading) => set({ isLoading }),

            setError: (error) => set({ error }),

            logout: () => set({
                user: null,
                token: null,
                error: null
            }),

            isAuthenticated: () => {
                const state = get()
                return !!state.token && !!state.user
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
