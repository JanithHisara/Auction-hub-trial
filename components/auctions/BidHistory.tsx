import { formatCurrency, formatDate } from '@/lib/utils'
import type { Bid } from '@/types/database'

interface BidHistoryProps {
  bids: Bid[]
}

export default function BidHistory({ bids }: BidHistoryProps) {
  if (bids.length === 0) {
    return (
      <div className="bg-white border border-[var(--border)] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4">Bid History</h2>
        <p className="text-[var(--text-secondary)] text-center py-6 sm:py-8 text-xs sm:text-sm lg:text-base">No bids yet</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm">
      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] mb-3 sm:mb-4 lg:mb-6">Bid History</h2>
      <div className="space-y-2 sm:space-y-3">
        {bids.slice(0, 10).map((bid, index) => (
          <div
            key={bid.id}
            className={`flex justify-between items-center p-2.5 sm:p-3 lg:p-4 rounded-lg border ${
              index === 0
                ? 'bg-[var(--gold-light)]/20 border-[var(--gold-light)]'
                : 'bg-[var(--background)] border-[var(--border)]'
            }`}
          >
            <div className="flex-1 min-w-0 pr-2 sm:pr-3">
              <p className={`text-sm sm:text-base lg:text-lg font-semibold ${index === 0 ? 'text-[var(--gold-dark)]' : 'text-[var(--text-primary)]'}`}>
                {formatCurrency(bid.bid_amount)}
              </p>
              <p className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-muted)] truncate">
                {(bid.user as any)?.email || 'Unknown'} • {formatDate(bid.created_at)}
              </p>
            </div>
            {index === 0 && (
              <span className="px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0">
                Highest
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

