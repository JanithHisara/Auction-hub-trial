import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid } from '@/types/database'

interface BidHistoryProps {
  bids: Bid[]
}

export default function BidHistory({ bids }: BidHistoryProps) {
  if (bids.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4">Bid History</h2>
        <p className="text-[var(--text-secondary)] text-center py-8 text-sm sm:text-base">No bids yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Bid History</h2>
      <div className="space-y-3">
        {bids.slice(0, 10).map((bid, index) => (
          <div
            key={bid.id}
            className={`flex justify-between items-center p-3 sm:p-4 rounded-lg border ${
              index === 0
                ? 'bg-[var(--gold-light)]/20 border-[var(--gold-light)]'
                : 'bg-[var(--background)] border-[var(--border)]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className={`text-base sm:text-lg font-semibold ${index === 0 ? 'text-[var(--gold-dark)]' : 'text-[var(--text-primary)]'}`}>
                {formatCurrency(bid.bid_amount)}
              </p>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] truncate">
                {(bid.user as any)?.email || 'Unknown'} • {formatDate(bid.created_at)}
              </p>
            </div>
            {index === 0 && (
              <span className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white text-xs font-semibold rounded-full flex-shrink-0 ml-3">
                Highest
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

