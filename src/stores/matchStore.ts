import { create } from 'zustand'
import type { Match, QueueStatus } from '../types'

interface MatchStore {
    queueStatus: QueueStatus
    currentMatch: Match | null
    autoRejoin: boolean

    // Actions
    setQueueStatus: (status: QueueStatus) => void
    setMatch: (match: Match | null) => void
    setAutoRejoin: (autoRejoin: boolean) => void
    reset: () => void
}

export const useMatchStore = create<MatchStore>((set) => ({
    queueStatus: 'idle',
    currentMatch: null,
    autoRejoin: true,

    setQueueStatus: (queueStatus) => set({ queueStatus }),

    setMatch: (currentMatch) => set({ currentMatch }),

    setAutoRejoin: (autoRejoin) => set({ autoRejoin }),

    reset: () => set({
        queueStatus: 'idle',
        currentMatch: null
    })
}))
