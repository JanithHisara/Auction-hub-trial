import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

async function getStats() {
  const user = await requireAdmin()
  const supabase = await createClient()

  const { data: gems } = await supabase
    .from('gems')
    .select('id, status, starting_price')
    .eq('admin_id', user.id)

  const { data: bids } = await supabase
    .from('bids')
    .select('id, gem_id, bid_amount')
    .in('gem_id', gems?.map(g => g.id) || [])

  const activeGems = gems?.filter(g => g.status === 'active') || []
  const highestBids = activeGems.map(gem => {
    const gemBids = bids?.filter(b => b.gem_id === gem.id) || []
    const highest = gemBids.reduce((max, bid) => 
      bid.bid_amount > max ? bid.bid_amount : max, 0
    )
    return { gemId: gem.id, amount: highest || gem.starting_price }
  })

  const totalValue = highestBids.reduce((sum, h) => sum + h.amount, 0)

  return {
    totalGems: gems?.length || 0,
    activeAuctions: activeGems.length,
    completedAuctions: gems?.filter(g => g.status === 'completed').length || 0,
    draftGems: gems?.filter(g => g.status === 'draft').length || 0,
    totalBids: bids?.length || 0,
    totalValue,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    {
      title: 'Total Gems',
      value: stats.totalGems.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Active Auctions',
      value: stats.activeAuctions.toString(),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Completed',
      value: stats.completedAuctions.toString(),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Total Bids',
      value: stats.totalBids.toString(),
      color: 'text-[var(--gold-dark)]',
      bgColor: 'bg-[var(--gold-light)]/20',
      borderColor: 'border-[var(--gold-light)]',
    },
    {
      title: 'Draft Gems',
      value: stats.draftGems.toString(),
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Total Value',
      value: formatCurrency(stats.totalValue),
      color: 'text-[var(--gold-dark)]',
      bgColor: 'bg-[var(--gold-light)]/20',
      borderColor: 'border-[var(--gold-light)]',
    },
  ]

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} border ${card.borderColor} rounded-xl p-5 sm:p-6 shadow-sm`}
          >
            <h3 className="text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2">{card.title}</h3>
            <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] mb-4 sm:mb-6">Quick Actions</h2>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <Link
            href="/admin/gems/new"
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 text-sm sm:text-base shadow-md"
          >
            Create New Gem
          </Link>
          <Link
            href="/admin/gems"
            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-white border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:bg-[var(--background)] transition-colors text-sm sm:text-base shadow-sm"
          >
            View All Gems
          </Link>
        </div>
      </div>
    </div>
  )
}

