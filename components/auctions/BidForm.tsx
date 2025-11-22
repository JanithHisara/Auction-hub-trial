'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Gem } from '@/types/database'

interface BidFormProps {
  gem: Gem
  currentBid: number // Note: This prop is less relevant now as we use gem.current_price
}

export default function BidForm({ gem, currentBid }: BidFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [checkingRegistration, setCheckingRegistration] = useState(true)
  const [hasAcceptedCurrentPrice, setHasAcceptedCurrentPrice] = useState(false)

  // Use gem.current_price as the source of truth for round price
  const roundPrice = gem.current_price || gem.starting_price

  useEffect(() => {
    checkRegistration()
    checkIfAccepted()
  }, [gem.id, roundPrice])

  const checkRegistration = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCheckingRegistration(false)
        return
      }

      const response = await fetch(`/api/gems/${gem.id}/register`)
      if (response.ok) {
        const data = await response.json()
        setIsRegistered(data.isRegistered)
      }
    } catch (err) {
      console.error('Failed to check registration', err)
    } finally {
      setCheckingRegistration(false)
    }
  }

  const checkIfAccepted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('bids')
        .select('id')
        .eq('gem_id', gem.id)
        .eq('user_id', user.id)
        .eq('bid_amount', roundPrice)
        .single()
      
      setHasAcceptedCurrentPrice(!!data)
    } catch (err) {
      console.error('Failed to check acceptance', err)
    }
  }

  const handleRegister = async () => {
    setLoading(true)
    setError(null)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    try {
      const response = await fetch(`/api/gems/${gem.id}/register`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to register')
      }

      setIsRegistered(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptPrice = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/gems/${gem.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), 
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept price')
      }

      setHasAcceptedCurrentPrice(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to place bid')
    } finally {
      setLoading(false)
    }
  }

  if (checkingRegistration) {
    return (
      <div className="bg-[var(--gold-light)]/10 border border-[var(--gold-light)] rounded-xl p-5 sm:p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    )
  }

  return (
    <div className="bg-[var(--gold-light)]/10 border border-[var(--gold-light)] rounded-xl p-5 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">
        {isRegistered ? 'Current Round' : 'Join Auction'}
      </h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {!isRegistered ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            You must register for this auction before you can participate. Registration is free and instant.
          </p>
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base shadow-md"
          >
            {loading ? 'Registering...' : 'Register to Participate'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm sm:text-base mb-2">
            <span className="text-[var(--text-secondary)]">Current Price Level:</span>
            <span className="font-bold text-[var(--gold-dark)]">{formatCurrency(roundPrice)}</span>
          </div>
          
          {hasAcceptedCurrentPrice ? (
            <div className="w-full px-6 py-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">Price Accepted</span>
            </div>
          ) : (
            <button
              onClick={handleAcceptPrice}
              disabled={loading}
              className="w-full px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                'Processing...'
              ) : (
                <>
                  <span>Accept {formatCurrency(roundPrice)}</span>
                </>
              )}
            </button>
          )}
          <p className="text-xs text-center text-[var(--text-muted)]">
            Confirm you are willing to pay {formatCurrency(roundPrice)} to stay in the auction.
          </p>
        </div>
      )}
    </div>
  )
}
