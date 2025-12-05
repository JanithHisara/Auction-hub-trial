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
      <div className="min-h-screen bg-[var(--background)] relative">
        <div className="fixed inset-0 bg-grid-pattern opacity-30" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-black text-white mb-8">My Bids</h1>
          <div className="card-glass rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold text-white mb-3">No Bids Yet</h2>
            <p className="text-[var(--text-secondary)] mb-6">Start bidding on exclusive items</p>
            <Link href="/" className="btn-gold inline-block">
              <span>Browse Auctions</span>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const bidsWithHighest = await Promise.all(
    bids.map(async (bid) => {
      const gem = bid.gem as Record<string, unknown>
      const { data: highestBid } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('gem_id', gem.id as string)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single()

      const { data: images } = await supabase
        .from('gem_images')
        .select('image_url')
        .eq('gem_id', gem.id as string)
        .order('display_order')
        .limit(1)
        .single()

      return {
        ...bid,
        highestBid: highestBid?.bid_amount || (gem.starting_price as number),
        imageUrl: images?.image_url || null,
      }
    })
  )

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white">My Bids</h1>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--surface)] rounded-full text-[var(--text-secondary)] text-sm">
            {bids.length} total bids
          </span>
        </div>

        <div className="space-y-4">
          {bidsWithHighest.map((bid) => {
            const gem = bid.gem as Record<string, unknown>
            const isHighest = bid.bid_amount >= bid.highestBid
            const isActive = gem.status === 'active' && new Date(gem.end_time as string) > new Date()

            return (
              <Link
                key={bid.id}
                href={`/gems/${gem.id}`}
                className="card-auction block group"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:p-5">
                  {/* Image */}
                  <div className="flex-shrink-0 w-full sm:w-20 h-32 sm:h-20 md:w-24 md:h-24 rounded-xl overflow-hidden bg-[var(--surface)]">
                    {bid.imageUrl ? (
                      <img
                        src={bid.imageUrl}
                        alt={gem.name as string}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">💎</div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[var(--gold)] transition-colors truncate">
                        {gem.name as string}
                      </h3>
                      {isHighest && isActive && (
                        <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[var(--gold)] text-black text-xs font-bold rounded-full flex-shrink-0">
                          LEADING
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">Your Bid</p>
                        <p className="text-[var(--gold)] font-bold font-mono">{formatCurrency(bid.bid_amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">Current</p>
                        <p className="text-white font-bold font-mono">{formatCurrency(bid.highestBid)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">Status</p>
                        <p className={`font-bold capitalize ${
                          gem.status === 'active' ? 'text-emerald-400' : 'text-[var(--text-secondary)]'
                        }`}>
                          {gem.status as string}
                        </p>
                      </div>
                      {isActive && (
                        <div>
                          <p className="text-[10px] sm:text-xs text-[var(--text-muted)]">Ends In</p>
                          <CountdownTimer endTime={gem.end_time as string} />
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] sm:text-xs text-[var(--text-muted)] mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-[var(--border)]">
                      Bid placed {formatDate(bid.created_at)}
                      {bid.points_earned > 0 && (
                        <span className="ml-2 text-[var(--gold)]">+{bid.points_earned} pts</span>
                      )}
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
