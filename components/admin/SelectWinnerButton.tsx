'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid } from '@/types/database'

export default function SelectWinnerButton({ gemId, bids }: { gemId: string; bids: Bid[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null)

  const handleSelectWinner = async () => {
    if (!selectedBidId) {
      alert('Please select a winning bid')
      return
    }

    if (!confirm('Are you sure you want to select this bidder as the winner?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/auctions/${gemId}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_id: selectedBidId }),
      })

      if (!response.ok) throw new Error('Failed to select winner')

      router.refresh()
    } catch (error) {
      alert('Failed to select winner')
    } finally {
      setLoading(false)
    }
  }

  if (bids.length === 0) {
    return (
      <div className="px-6 py-3 bg-white border border-[var(--border)] text-[var(--text-secondary)] rounded-lg shadow-sm">
        No bids to select from
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-sm">
        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Select Winner</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {bids.map((bid) => (
            <label
              key={bid.id}
              className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedBidId === bid.id
                  ? 'border-[var(--gold)] bg-[var(--gold-light)]/20'
                  : 'border-[var(--border)] bg-[var(--background)] hover:border-[var(--gold-light)]'
              }`}
            >
              <input
                type="radio"
                name="winner"
                value={bid.id}
                checked={selectedBidId === bid.id}
                onChange={(e) => setSelectedBidId(e.target.value)}
                className="mr-3"
              />
              <span className="text-[var(--text-primary)] font-semibold">{formatCurrency(bid.bid_amount)}</span>
              <span className="text-[var(--text-secondary)] ml-2">
                • {(bid.user as any)?.email || 'Unknown'} • {formatDate(bid.created_at)}
              </span>
            </label>
          ))}
        </div>
        <button
          onClick={handleSelectWinner}
          disabled={loading || !selectedBidId}
          className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 shadow-md"
        >
          {loading ? 'Selecting...' : 'Select Winner'}
        </button>
      </div>
    </div>
  )
}

