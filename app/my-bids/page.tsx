import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import CountdownTimer from '@/components/auctions/CountdownTimer'

export default async function MyBidsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: bids } = await supabase
    .from('bids')
    .select('*, gem:gems(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (!bids || bids.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">My Bids</h1>
          <div className="bg-white border border-[var(--border)] rounded-2xl p-12 text-center shadow-sm">
            <p className="text-[var(--text-secondary)] text-lg">You haven't placed any bids yet</p>
            <Link
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 shadow-md"
            >
              Browse Auctions
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const bidsWithHighest = await Promise.all(
    bids.map(async (bid) => {
      const gem = bid.gem as any
      const { data: highestBid } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('gem_id', gem.id)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single()

      const { data: images } = await supabase
        .from('gem_images')
        .select('image_url')
        .eq('gem_id', gem.id)
        .order('display_order')
        .limit(1)
        .single()

      return {
        ...bid,
        highestBid: highestBid?.bid_amount || gem.starting_price,
        imageUrl: images?.image_url || null,
      }
    })
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8] py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-6 sm:mb-8">My Bids</h1>
        <div className="space-y-4">
          {bidsWithHighest.map((bid) => {
            const gem = bid.gem as any
            const isHighest = bid.bid_amount >= bid.highestBid
            const isActive = gem.status === 'active' && new Date(gem.end_time) > new Date()

            return (
              <Link
                key={bid.id}
                href={`/gems/${gem.id}`}
                className="block bg-white border border-[var(--border)] rounded-xl p-5 sm:p-6 hover:border-[var(--gold-light)] hover:shadow-md transition-all card-premium"
              >
                <div className="flex gap-4 sm:gap-6">
                  {bid.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={bid.imageUrl}
                        alt={gem.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] truncate">{gem.name}</h3>
                      {isHighest && isActive && (
                        <span className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white text-xs font-semibold rounded-full flex-shrink-0">
                          Leading
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-3">
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Your Bid</p>
                        <p className="text-base sm:text-lg text-[var(--gold-dark)] font-semibold">{formatCurrency(bid.bid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Current Highest</p>
                        <p className="text-base sm:text-lg text-[var(--text-primary)] font-semibold">{formatCurrency(bid.highestBid)}</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Status</p>
                        <p className="text-base sm:text-lg text-[var(--text-primary)] font-semibold capitalize">{gem.status}</p>
                      </div>
                      {isActive && (
                        <div>
                          <p className="text-xs sm:text-sm text-[var(--text-muted)] mb-1">Time Left</p>
                          <div className="text-base sm:text-lg">
                            <CountdownTimer endTime={gem.end_time} />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                      Bid placed on {formatDate(bid.created_at)}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

