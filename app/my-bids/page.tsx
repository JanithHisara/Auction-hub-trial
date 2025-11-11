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
      <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8] py-8 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-6 sm:mb-8">My Bids</h1>
          <div className="bg-white border border-[var(--border)] rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-sm">
            <p className="text-[var(--text-secondary)] text-base sm:text-lg">You haven't placed any bids yet</p>
            <Link
              href="/"
              className="inline-block mt-4 sm:mt-6 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 shadow-md text-sm sm:text-base"
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
        <div className="space-y-3 sm:space-y-4">
          {bidsWithHighest.map((bid) => {
            const gem = bid.gem as any
            const isHighest = bid.bid_amount >= bid.highestBid
            const isActive = gem.status === 'active' && new Date(gem.end_time) > new Date()

            return (
              <Link
                key={bid.id}
                href={`/gems/${gem.id}`}
                className="block bg-white border border-[var(--border)] rounded-xl p-4 sm:p-5 lg:p-6 hover:border-[var(--gold-light)] hover:shadow-md transition-all card-premium"
              >
                <div className="flex gap-3 sm:gap-4 lg:gap-6">
                  {bid.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={bid.imageUrl}
                        alt={gem.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2 sm:mb-3 gap-2">
                      <h3 className="text-base sm:text-lg lg:text-xl font-bold text-[var(--text-primary)] truncate">{gem.name}</h3>
                      {isHighest && isActive && (
                        <span className="px-2 sm:px-2.5 lg:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white text-[10px] sm:text-xs font-semibold rounded-full flex-shrink-0">
                          Leading
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-2 sm:mb-3">
                      <div>
                        <p className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-muted)] mb-0.5 sm:mb-1">Your Bid</p>
                        <p className="text-sm sm:text-base lg:text-lg text-[var(--gold-dark)] font-semibold">{formatCurrency(bid.bid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-muted)] mb-0.5 sm:mb-1">Current Highest</p>
                        <p className="text-sm sm:text-base lg:text-lg text-[var(--text-primary)] font-semibold">{formatCurrency(bid.highestBid)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-muted)] mb-0.5 sm:mb-1">Status</p>
                        <p className="text-sm sm:text-base lg:text-lg text-[var(--text-primary)] font-semibold capitalize">{gem.status}</p>
                      </div>
                      {isActive && (
                        <div>
                          <p className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-muted)] mb-0.5 sm:mb-1">Time Left</p>
                          <div className="text-sm sm:text-base lg:text-lg">
                            <CountdownTimer endTime={gem.end_time} />
                          </div>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
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

