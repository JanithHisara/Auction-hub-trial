'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { Gem } from '@/types/database'

interface BidFormProps {
  gem: Gem
  currentBid: number
}

export default function BidForm({ gem, currentBid }: BidFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [bidAmount, setBidAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minBid = currentBid + gem.min_bid_increment

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount < minBid) {
      setError(`Minimum bid is ${formatCurrency(minBid)}`)
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/gems/${gem.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_amount: amount }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to place bid')
      }

      setBidAmount('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to place bid')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[var(--gold-light)]/10 border border-[var(--gold-light)] rounded-xl p-5 sm:p-6">
      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-4">Place Your Bid</h3>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-[var(--text-primary)] mb-2">
            Bid Amount (Minimum: {formatCurrency(minBid)})
          </label>
          <input
            type="number"
            min={minBid}
            step={gem.min_bid_increment}
            value={bidAmount}
            onChange={(e) => setBidAmount(e.target.value)}
            required
            className="w-full px-4 py-2.5 sm:py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            placeholder={formatCurrency(minBid)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 text-sm sm:text-base shadow-md"
        >
          {loading ? 'Placing Bid...' : 'Place Bid'}
        </button>
      </form>
    </div>
  )
}

