import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import CountdownTimer from '@/components/auctions/CountdownTimer'

async function getActiveAuctions() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: gems } = await supabase
    .from('gems')
    .select('*')
    .eq('status', 'active')
    .gte('end_time', now)
    .order('end_time', { ascending: true })

  if (!gems) return []

  const gemsWithBids = await Promise.all(
    gems.map(async (gem) => {
      const { data: bids } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('gem_id', gem.id)
        .order('bid_amount', { ascending: false })
        .limit(1)

      const { data: images } = await supabase
        .from('gem_images')
        .select('image_url')
        .eq('gem_id', gem.id)
        .order('display_order')
        .limit(1)
        .single()

      return {
        ...gem,
        currentBid: bids?.[0]?.bid_amount || gem.starting_price,
        bidCount: bids?.length || 0,
        imageUrl: images?.image_url || null,
      }
    })
  )

  return gemsWithBids
}

export default async function HomePage() {
  const auctions = await getActiveAuctions()
  const totalBids = auctions.reduce((sum, gem) => sum + gem.bidCount, 0)
  const totalValue = auctions.reduce((sum, gem) => sum + gem.currentBid, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8]">
      {/* Enhanced decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--gold-light)]/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[var(--gold)]/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--gold-accent)]/3 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Enhanced Hero Section */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur-md border border-[var(--gold-light)]/50 rounded-full mb-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="relative">
              <div className="w-2.5 h-2.5 bg-[var(--gold-accent)] rounded-full animate-pulse-gold" />
              <div className="absolute inset-0 w-2.5 h-2.5 bg-[var(--gold-accent)] rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)] tracking-wide">Live Auctions</span>
            {auctions.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-[var(--gold-accent)]/20 text-[var(--gold-dark)] text-xs font-bold rounded-full">
                {auctions.length} Active
              </span>
            )}
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 sm:mb-8 tracking-tight leading-tight">
            <span className="block mb-2 bg-gradient-to-r from-[var(--gold-dark)] via-[var(--gold-accent)] to-[var(--gold-dark)] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Premium Gem Auctions
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl lg:text-3xl text-[var(--text-secondary)] max-w-4xl mx-auto font-light leading-relaxed mb-8">
            Discover rare gems and place your bids in exclusive auctions
          </p>

          {/* Statistics Bar */}
          {auctions.length > 0 && (
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mt-12">
              <div className="flex flex-col items-center px-6 py-4 bg-white/60 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-sm min-w-[120px]">
                <span className="text-2xl sm:text-3xl font-bold text-[var(--gold-dark)] mb-1">{auctions.length}</span>
                <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Auctions</span>
              </div>
              <div className="flex flex-col items-center px-6 py-4 bg-white/60 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-sm min-w-[120px]">
                <span className="text-2xl sm:text-3xl font-bold text-[var(--gold-dark)] mb-1">{totalBids}</span>
                <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Bids</span>
              </div>
              <div className="flex flex-col items-center px-6 py-4 bg-white/60 backdrop-blur-sm border border-[var(--border)] rounded-2xl shadow-sm min-w-[120px]">
                <span className="text-xl sm:text-2xl font-bold text-[var(--gold-dark)] mb-1">{formatCurrency(totalValue)}</span>
                <span className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] uppercase tracking-wider">Total Value</span>
              </div>
            </div>
          )}
        </div>

        {auctions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {auctions.map((gem, index) => {
              const bidIncrease = ((gem.currentBid - gem.starting_price) / gem.starting_price) * 100
              const isHot = gem.bidCount >= 5 || bidIncrease > 50
              
              return (
                <Link
                  key={gem.id}
                  href={`/gems/${gem.id}`}
                  className="group card-premium rounded-3xl overflow-hidden h-full flex flex-col transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Enhanced Image Section */}
                  <div className="relative h-80 bg-gradient-to-br from-[var(--gold-light)]/20 to-[var(--gold)]/10 overflow-hidden">
                    {gem.imageUrl ? (
                      <>
                        <img
                          src={gem.imageUrl}
                          alt={gem.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--gold-accent)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--gold-light)]/30 to-[var(--gold)]/20">
                        <svg className="w-24 h-24 text-[var(--gold-dark)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Enhanced Timer Badge */}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[var(--gold-light)] shadow-xl group-hover:shadow-2xl transition-shadow">
                      <div className="flex items-center gap-1.5 mb-1">
                        <svg className="w-3 h-3 text-[var(--gold-dark)]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Ends In</span>
                      </div>
                      <CountdownTimer endTime={gem.end_time} />
                    </div>

                    {/* Enhanced Badges */}
                    {gem.bidCount > 0 && (
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        <div className="bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl backdrop-blur-sm">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            {gem.bidCount} {gem.bidCount === 1 ? 'Bid' : 'Bids'}
                          </span>
                        </div>
                        {isHot && (
                          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg animate-pulse">
                            🔥 Hot
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Content Section */}
                  <div className="p-6 sm:p-7 flex flex-col flex-grow bg-white">
                    <div className="mb-4">
                      <h3 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 group-hover:text-[var(--gold-dark)] transition-colors line-clamp-1">
                        {gem.name}
                      </h3>
                      <p className="text-[var(--text-secondary)] mb-6 line-clamp-2 text-sm sm:text-base leading-relaxed flex-grow">
                        {gem.description}
                      </p>
                    </div>

                    {/* Enhanced Price Section */}
                    <div className="pt-6 border-t border-[var(--border)] mt-auto">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 uppercase tracking-wider flex items-center gap-2">
                            <span>Current Bid</span>
                            {bidIncrease > 0 && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-bold rounded-full">
                                +{bidIncrease.toFixed(0)}%
                              </span>
                            )}
                          </p>
                          <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] bg-clip-text text-transparent">
                            {formatCurrency(gem.currentBid)}
                          </p>
                        </div>
                        <div className="px-5 py-3 bg-gradient-to-br from-[var(--gold-light)]/40 to-[var(--gold-light)]/20 rounded-xl border border-[var(--gold-light)] shadow-sm">
                          <p className="text-xs font-semibold text-[var(--text-muted)] mb-1 uppercase tracking-wider">Starting</p>
                          <p className="text-base sm:text-lg font-bold text-[var(--gold-dark)]">{formatCurrency(gem.starting_price)}</p>
                        </div>
                      </div>
                      
                      {/* View Details CTA */}
                      <div className="mt-6 pt-4 border-t border-[var(--border)]">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--text-muted)] font-medium">View Details</span>
                          <svg className="w-5 h-5 text-[var(--gold-dark)] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 sm:py-32">
            <div className="max-w-md mx-auto">
              <div className="mb-8 inline-flex items-center justify-center w-28 h-28 bg-gradient-to-br from-[var(--gold-light)]/30 to-[var(--gold)]/20 rounded-full shadow-lg">
                <svg className="w-14 h-14 text-[var(--gold-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">No Active Auctions</h2>
              <p className="text-lg text-[var(--text-secondary)] mb-8">Check back soon for new gem listings</p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[var(--border)] rounded-full shadow-sm">
                <div className="w-2 h-2 bg-[var(--gold-accent)] rounded-full animate-pulse" />
                <span className="text-sm font-medium text-[var(--text-secondary)]">We'll notify you when new auctions start</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
