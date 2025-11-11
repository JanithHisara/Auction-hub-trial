import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { GemStatus } from '@/types/database'


export default async function GemsPage() {
  const user = await requireAdmin()
  const supabase = await createClient()

  const { data: gems } = await supabase
    .from('gems')
    .select('*')
    .eq('admin_id', user.id)
    .order('created_at', { ascending: false })

  const gemsWithBids = await Promise.all(
    (gems || []).map(async (gem) => {
      const { data: bids } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('gem_id', gem.id)
        .order('bid_amount', { ascending: false })
        .limit(1)

      const highestBid = bids?.[0]?.bid_amount || gem.starting_price

      return {
        ...gem,
        highestBid,
        bidCount: bids?.length || 0,
      }
    })
  )

  const statusColorsLight: Record<GemStatus, string> = {
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    active: 'bg-green-50 text-green-700 border-green-200',
    ended: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    completed: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">All Gems</h2>
        <Link
          href="/admin/gems/new"
          className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 text-sm sm:text-base shadow-md"
        >
          New Gem
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {gemsWithBids.map((gem) => (
          <Link
            key={gem.id}
            href={`/admin/gems/${gem.id}`}
            className="bg-white border border-[var(--border)] rounded-xl p-5 sm:p-6 hover:border-[var(--gold-light)] hover:shadow-md transition-all card-premium"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate">{gem.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border flex-shrink-0 ${statusColorsLight[gem.status as GemStatus] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                  >
                    {gem.status}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)] mb-4 line-clamp-2 text-sm sm:text-base">{gem.description}</p>
                <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[var(--text-muted)]">Starting Price: </span>
                    <span className="text-[var(--gold-dark)] font-semibold">
                      {formatCurrency(gem.starting_price)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Highest Bid: </span>
                    <span className="text-green-600 font-semibold">
                      {formatCurrency(gem.highestBid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">Bids: </span>
                    <span className="text-[var(--text-primary)] font-semibold">{gem.bidCount}</span>
                  </div>
                  {gem.status === 'active' && (
                    <div>
                      <span className="text-[var(--text-muted)]">Ends: </span>
                      <span className="text-yellow-600 font-semibold">
                        {formatDate(gem.end_time)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}

        {gemsWithBids.length === 0 && (
          <div className="text-center py-12 sm:py-16">
            <p className="text-[var(--text-secondary)] mb-4 text-sm sm:text-base">No gems created yet</p>
            <Link
              href="/admin/gems/new"
              className="inline-block px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 text-sm sm:text-base shadow-md"
            >
              Create Your First Gem
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

