import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Auction } from '@/types/database'

async function getAuctions() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (userData?.role !== 'admin') redirect('/')

  const { data: auctions } = await supabase
    .from('auctions')
    .select('*')
    .order('created_at', { ascending: false })

  // Get counts for each auction
  const auctionsWithCounts = await Promise.all(
    (auctions || []).map(async (auction) => {
      const { count: itemsCount } = await supabase
        .from('gems')
        .select('*', { count: 'exact', head: true })
        .eq('auction_id', auction.id)

      const { count: registeredCount } = await supabase
        .from('auction_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('auction_id', auction.id)

      return {
        ...auction,
        items_count: itemsCount || 0,
        registered_count: registeredCount || 0,
      }
    })
  )

  return auctionsWithCounts as (Auction & { items_count: number; registered_count: number })[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  upcoming: 'bg-blue-500/20 text-blue-400',
  registration_open: 'bg-emerald-500/20 text-emerald-400',
  live: 'bg-red-500/20 text-red-400',
  ended: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-purple-500/20 text-purple-400',
}

export default async function AdminAuctionsPage() {
  const auctions = await getAuctions()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Auctions</h1>
          <p className="text-[var(--text-secondary)]">Manage your auction events</p>
        </div>
        <Link 
          href="/admin/auctions/new"
          className="btn-gold"
        >
          <span>+ Create Auction</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Auctions', value: auctions.length, icon: '📊' },
          { label: 'Live', value: auctions.filter(a => a.status === 'live').length, icon: '🔴' },
          { label: 'Upcoming', value: auctions.filter(a => ['upcoming', 'registration_open'].includes(a.status)).length, icon: '📅' },
          { label: 'Total Items', value: auctions.reduce((sum, a) => sum + a.items_count, 0), icon: '💎' },
        ].map((stat) => (
          <div key={stat.label} className="card-glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Auctions Table */}
      <div className="card-glass rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="text-left px-6 py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Auction</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Items</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Registered</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Date</th>
              <th className="text-right px-6 py-4 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {auctions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                  No auctions yet. Create your first auction to get started.
                </td>
              </tr>
            ) : (
              auctions.map((auction) => (
                <tr key={auction.id} className="hover:bg-[var(--surface-elevated)] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--surface)] flex items-center justify-center overflow-hidden">
                        {auction.banner_image_url ? (
                          <img src={auction.banner_image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xl opacity-50">💎</span>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">{auction.name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
                          {auction.description || 'No description'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[auction.status]}`}>
                      {auction.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">{auction.items_count}</td>
                  <td className="px-6 py-4 text-white">{auction.registered_count}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)] text-sm">
                    {formatDate(auction.auction_start)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/auctions/${auction.id}`}
                        className="px-3 py-1.5 text-xs font-medium bg-[var(--surface)] hover:bg-[var(--surface-elevated)] text-white rounded-lg transition-colors"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/admin/auctions/${auction.id}/edit`}
                        className="px-3 py-1.5 text-xs font-medium bg-[var(--gold)]/20 hover:bg-[var(--gold)]/30 text-[var(--gold)] rounded-lg transition-colors"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

