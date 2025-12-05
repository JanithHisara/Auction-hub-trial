import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Auction, Gem, AuctionRegistration } from '@/types/database'

async function getAuction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (userData?.role !== 'admin') redirect('/')

  const { data: auction } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', id)
    .single()

  if (!auction) return null

  // Get items with bid counts
  const { data: items } = await supabase
    .from('gems')
    .select('*, gem_images(*)')
    .eq('auction_id', id)
    .order('created_at')

  // Get bid counts for each item
  const itemsWithBids = await Promise.all(
    (items || []).map(async (item) => {
      const { count } = await supabase
        .from('bids')
        .select('*', { count: 'exact', head: true })
        .eq('gem_id', item.id)
      
      const { data: highestBid } = await supabase
        .from('bids')
        .select('bid_amount')
        .eq('gem_id', item.id)
        .order('bid_amount', { ascending: false })
        .limit(1)
        .single()

      return {
        ...item,
        bidsCount: count || 0,
        highestBid: highestBid?.bid_amount || item.starting_price,
      }
    })
  )

  // Get registrations
  const { data: registrations } = await supabase
    .from('auction_registrations')
    .select('*, user:users(email, anonymous_name)')
    .eq('auction_id', id)
    .order('registered_at', { ascending: false })

  return {
    auction,
    items: itemsWithBids,
    registrations: registrations || [],
  }
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  upcoming: 'bg-blue-500/20 text-blue-400',
  registration_open: 'bg-emerald-500/20 text-emerald-400',
  live: 'bg-red-500/20 text-red-400',
  ended: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-purple-500/20 text-purple-400',
}

const itemStatusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  ended: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-purple-500/20 text-purple-400',
}

const statusOptions = ['draft', 'upcoming', 'registration_open', 'live', 'ended', 'completed']

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

type ItemWithBids = Gem & { 
  gem_images: { image_url: string }[]
  bidsCount: number
  highestBid: number
}

export default async function AdminAuctionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getAuction(id)

  if (!data) notFound()

  const { auction, items, registrations } = data
  const totalBids = items.reduce((sum, item) => sum + item.bidsCount, 0)
  const totalValue = items.reduce((sum, item) => sum + item.highestBid, 0)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            href="/admin/auctions"
            className="text-sm text-[var(--text-muted)] hover:text-white mb-2 inline-block"
          >
            ← Back to Auctions
          </Link>
          <h1 className="text-3xl font-bold text-white">{auction.name}</h1>
          <p className="text-[var(--text-secondary)]">{auction.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            auction.auction_type === 'fixed_increment' 
              ? 'bg-purple-500/20 text-purple-400' 
              : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {auction.auction_type === 'fixed_increment' ? '⏱ Fixed Rounds' : '📈 Free Bidding'}
          </span>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors[auction.status]}`}>
            {auction.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <StatusUpdateForm auctionId={id} currentStatus={auction.status} />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon="👥" label="Registered" value={registrations.length} />
        <StatCard icon="💎" label="Items" value={items.length} />
        <StatCard icon="🎯" label="Total Bids" value={totalBids} />
        <StatCard icon="💰" label="Total Value" value={formatCurrency(totalValue)} accent />
        <StatCard icon="🎫" label="Max Spots" value={auction.max_participants || '∞'} />
      </div>

      {/* Schedule */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Schedule</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScheduleItem label="Registration Opens" value={formatDate(auction.registration_start)} />
          <ScheduleItem label="Registration Closes" value={formatDate(auction.registration_end)} />
          <ScheduleItem label="Auction Starts" value={formatDate(auction.auction_start)} />
          <ScheduleItem label="Auction Ends" value={formatDate(auction.auction_end)} />
        </div>
      </div>

      {/* Items Section */}
      <div className="card-glass rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Auction Items</h2>
            <p className="text-sm text-[var(--text-muted)]">{items.length} items • {totalBids} total bids</p>
          </div>
          <Link href={`/admin/gems/new?auction_id=${id}`} className="btn-gold">
            <span>+ Add Item</span>
          </Link>
        </div>
        
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item: ItemWithBids) => (
              <Link 
                key={item.id}
                href={`/admin/gems/${item.id}`}
                className="group flex gap-4 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:border-[var(--gold)]/50 transition-all"
              >
                {/* Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-[var(--background)]">
                  {item.gem_images?.[0]?.image_url ? (
                    <img 
                      src={item.gem_images[0].image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">💎</div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white group-hover:text-[var(--gold)] transition-colors truncate">
                      {item.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${itemStatusColors[item.status]}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-1 mb-3">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-[var(--text-muted)]">Starting: </span>
                      <span className="text-white font-mono">{formatCurrency(item.starting_price)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Current: </span>
                      <span className="text-[var(--gold)] font-mono font-bold">{formatCurrency(item.highestBid)}</span>
                    </div>
                    <div>
                      <span className="text-[var(--text-muted)]">Bids: </span>
                      <span className="text-white">{item.bidsCount}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden sm:flex items-center">
                  <span className="text-[var(--text-muted)] group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto bg-[var(--surface)] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-3xl">💎</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Items Yet</h3>
            <p className="text-[var(--text-muted)] mb-4">Add items to this auction</p>
            <Link href={`/admin/gems/new?auction_id=${id}`} className="btn-gold inline-block">
              <span>+ Add First Item</span>
            </Link>
          </div>
        )}
      </div>

      {/* Registrations */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Registrations ({registrations.length})</h2>
        
        {registrations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">User</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Registered</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Email Sent</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Access</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {registrations.map((reg: AuctionRegistration & { user: { email: string; anonymous_name?: string } }) => (
                  <tr key={reg.id} className="hover:bg-[var(--surface-elevated)]">
                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{reg.user?.anonymous_name || 'Anonymous'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{reg.user?.email}</p>
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)] text-sm">
                      {formatDate(reg.registered_at)}
                    </td>
                    <td className="py-3 px-4">
                      {reg.email_sent_at ? (
                        <span className="text-emerald-400 text-sm">✓ Sent</span>
                      ) : (
                        <span className="text-amber-400 text-sm">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-white">{reg.access_count}x</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${reg.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {reg.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--text-muted)]">
            No registrations yet
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent = false }: { icon: string; label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card-glass rounded-xl p-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-2xl font-bold ${accent ? 'text-[var(--gold)]' : 'text-white'}`}>{value}</p>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  )
}

function ScheduleItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--surface)] rounded-lg">
      <p className="text-xs text-[var(--text-muted)] uppercase mb-1">{label}</p>
      <p className="text-white font-medium">{value}</p>
    </div>
  )
}

function StatusUpdateForm({ auctionId, currentStatus }: { auctionId: string; currentStatus: string }) {
  return (
    <form action={`/api/admin/auctions/${auctionId}/status`} method="POST" className="flex items-center gap-2">
      <select 
        name="status" 
        defaultValue={currentStatus}
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-white text-sm"
      >
        {statusOptions.map(status => (
          <option key={status} value={status}>
            {status.replace('_', ' ').toUpperCase()}
          </option>
        ))}
      </select>
      <button type="submit" className="btn-gold text-sm py-2 px-4">
        <span>Update Status</span>
      </button>
    </form>
  )
}
