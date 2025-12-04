'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  auctionId: string
  userId?: string
}

export default function RegisterButton({ auctionId, userId }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!userId) {
      router.push('/login')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/auctions/${auctionId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Registration failed')
      }

      setSuccess(true)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
          <span className="text-2xl">✅</span>
          <div>
            <p className="font-bold text-emerald-400">Successfully Registered!</p>
            <p className="text-sm text-[var(--text-muted)]">Check your email for access link</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleRegister}
        disabled={isLoading}
        className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Registering...
            </span>
          ) : (
            'Register for Auction'
          )}
        </span>
      </button>
      
      <p className="text-xs text-center text-[var(--text-muted)]">
        A unique access link will be sent to your email
      </p>
    </div>
  )
}

