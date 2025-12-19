import { create } from 'zustand'

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'failed'

interface VideoStore {
    localStream: MediaStream | null
    remoteStream: MediaStream | null
    isMuted: boolean
    isVideoOn: boolean
    connectionStatus: ConnectionStatus
    selectedCamera: string | null
    selectedMicrophone: string | null

    // Actions
    setLocalStream: (stream: MediaStream | null) => void
    setRemoteStream: (stream: MediaStream | null) => void
    toggleMute: () => void
    toggleVideo: () => void
    setConnectionStatus: (status: ConnectionStatus) => void
    setSelectedCamera: (deviceId: string) => void
    setSelectedMicrophone: (deviceId: string) => void
    reset: () => void
}

export const useVideoStore = create<VideoStore>((set, get) => ({
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoOn: true,
    connectionStatus: 'disconnected',
    selectedCamera: null,
    selectedMicrophone: null,

    setLocalStream: (localStream) => set({ localStream }),

    setRemoteStream: (remoteStream) => set({ remoteStream }),

    toggleMute: () => {
        const { localStream, isMuted } = get()
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = isMuted // If muted, enable; if unmuted, disable
            })
        }
        set({ isMuted: !isMuted })
    },

    toggleVideo: () => {
        const { localStream, isVideoOn } = get()
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !isVideoOn
            })
        }
        set({ isVideoOn: !isVideoOn })
    },

    setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

    setSelectedCamera: (selectedCamera) => set({ selectedCamera }),

    setSelectedMicrophone: (selectedMicrophone) => set({ selectedMicrophone }),

    reset: () => {
        const { localStream, remoteStream } = get()
        // Stop all tracks
        localStream?.getTracks().forEach(track => track.stop())
        remoteStream?.getTracks().forEach(track => track.stop())

        set({
            localStream: null,
            remoteStream: null,
            isMuted: false,
            isVideoOn: true,
            connectionStatus: 'disconnected'
        })
    }
}))
