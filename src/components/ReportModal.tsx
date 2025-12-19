import { useState } from 'react'
import { api } from '../services/api'
import type { ReportReason } from '../types'

interface ReportModalProps {
    onClose: () => void
    onSuccess: () => void
    reportedUserId: string
    roomId: string
}

const reportReasons: { value: ReportReason; label: string }[] = [
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'nudity', label: 'Nudity' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' }
]

export default function ReportModal({ onClose, onSuccess, reportedUserId, roomId }: ReportModalProps) {
    const [reason, setReason] = useState<ReportReason | ''>('')
    const [details, setDetails] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    console.log('[ReportModal] Room ID:', roomId) // For context, not sent to API

    const handleSubmit = async () => {
        if (!reason) return

        setIsSubmitting(true)

        try {
            await api.reportUser({
                reportedUserId,
                reason,
                additionalDetails: details || undefined
            })

            setSubmitted(true)

            setTimeout(() => {
                onSuccess()
            }, 1500)
        } catch (error) {
            console.error('Failed to submit report:', error)
        } finally {
            setIsSubmitting(false)
        }
    }


    if (submitted) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: '#FFFBF5',
                    borderRadius: '24px',
                    padding: '2rem',
                    maxWidth: '400px',
                    width: '90%',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        margin: '0 auto 1rem',
                        backgroundColor: '#E8F5E9',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <svg width="32" height="32" fill="none" stroke="#4CAF50" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#2D2D2D', marginBottom: '0.5rem' }}>
                        Report Submitted
                    </h2>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#6B6B6B' }}>
                        Thank you for helping keep Fluxx safe.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: '#FFFBF5',
                borderRadius: '24px',
                padding: '2rem',
                maxWidth: '450px',
                width: '90%',
                maxHeight: '90vh',
                overflow: 'auto'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#2D2D2D', margin: 0 }}>
                        Report User
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: 'none',
                            backgroundColor: '#F5F5F5',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <svg width="16" height="16" fill="none" stroke="#6B6B6B" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Reason Selection */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#2D2D2D', marginBottom: '0.75rem' }}>
                        Why are you reporting this user?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {reportReasons.map((option) => (
                            <label
                                key={option.value}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    backgroundColor: reason === option.value ? '#FFE5E5' : 'white',
                                    border: `1px solid ${reason === option.value ? '#FF6B6B' : '#E5E5E5'}`,
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <input
                                    type="radio"
                                    name="reason"
                                    value={option.value}
                                    checked={reason === option.value}
                                    onChange={(e) => setReason(e.target.value as ReportReason)}
                                    style={{ accentColor: '#FF6B6B' }}
                                />
                                <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', color: '#2D2D2D' }}>
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Details */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500, color: '#2D2D2D', marginBottom: '0.5rem' }}>
                        Additional details (optional)
                    </p>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Provide any additional information..."
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            backgroundColor: 'white',
                            border: '1px solid #E5E5E5',
                            borderRadius: '12px',
                            fontFamily: 'DM Sans, sans-serif',
                            fontSize: '0.875rem',
                            outline: 'none',
                            resize: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: '0.875rem',
                            backgroundColor: 'white',
                            border: '1px solid #E5E5E5',
                            borderRadius: '12px',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 600,
                            color: '#6B6B6B',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason || isSubmitting}
                        style={{
                            flex: 1,
                            padding: '0.875rem',
                            backgroundColor: '#FF6B6B',
                            border: 'none',
                            borderRadius: '12px',
                            fontFamily: 'Outfit, sans-serif',
                            fontWeight: 600,
                            color: 'white',
                            cursor: (!reason || isSubmitting) ? 'not-allowed' : 'pointer',
                            opacity: (!reason || isSubmitting) ? 0.7 : 1
                        }}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </div>
            </div>
        </div>
    )
}
