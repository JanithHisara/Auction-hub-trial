import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Auction, Gem, AuctionRegistration, RegistrationApprovalStatus } from '@/types/database'
import LocalTime from '@/components/ui/LocalTime'
import { ADMIN_ROLES } from '@/lib/permissions'

async function getAuction(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!userData?.role || !ADMIN_ROLES.includes(userData.role as typeof ADMIN_ROLES[number])) redirect('/')

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

  // Get registrations using admin client to bypass RLS on users join
  const adminClient = createAdminClient()
  const { data: registrations } = await adminClient
    .from('auction_registrations')
    .select('*, user:users!auction_registrations_user_id_fkey(email, anonymous_name, phone, display_name)')
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
    registration_closed: 'bg-indigo-500/20 text-indigo-400',
  live: 'bg-red-500/20 text-red-400',
  ended: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-purple-500/20 text-purple-400',
}

const itemStatusColors: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-400',
  pending: 'bg-blue-500/20 text-blue-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  ended: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-purple-500/20 text-purple-400',
}

import ProgressiveStatusActions from '@/components/admin/ProgressiveStatusActions'
import TenderStatusActions from '@/components/admin/TenderStatusActions'
import IncrementalStatusActions from '@/components/admin/IncrementalStatusActions'
import AuctionDetailClient from '@/components/admin/AuctionDetailClient'
import BidderHoldManager from '@/components/admin/BidderHoldManager'
import AuctionChatButton from '@/components/admin/AuctionChatButton'
import AddUserToAuctionButton from '@/components/admin/AddUserToAuctionButton'


function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rs. 0';
  const val = Number(amount);
  if (val >= 1_000_000_000) {
    return 'Rs. ' + (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (val >= 1_000_000) {
    return 'Rs. ' + (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (val >= 1_000) {
    return 'Rs. ' + (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return 'Rs. ' + val.toString();
  }
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
    const unpublishedItemCount = items?.filter(item => item.status !== 'published').length || 0;
  const approvedCount = registrations.filter(r => r.approval_status === 'approved').length

  return (
    <AuctionDetailClient auctionId={id}>
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            href="/admin/auctions"
            className="text-sm text-[var(--text-muted)] hover:text-white mb-2 inline-block"
          >
             Back to Auctions
          </Link>
          <h1 className="text-3xl font-bold text-white">{auction.name}</h1>
          <p className="text-[var(--text-secondary)]">{auction.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
            auction.auction_type === 'progressive_elimination_auction' 
              ? 'bg-purple-500/20 text-purple-400' 
              : auction.auction_type === 'incremental_approval_auction'
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {auction.auction_type === 'progressive_elimination_auction' 
              ? ' English Auction' 
              : auction.auction_type === 'incremental_approval_auction'
                ? ' Progressive Elimination'
                : ' Closed Bid'}
          </span>
          <span className={`px-4 py-2 rounded-full text-sm font-bold ${statusColors[auction.status]}`}>
            {auction.auction_type === 'tender_base_fixed_bid' && auction.status === 'registration_closed' ? 'BIDDING CLOSED' : auction.auction_type === 'tender_base_fixed_bid' && auction.status === 'live' ? 'BIDDING OPEN' : auction.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card-glass rounded-xl p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Auction Controls</h2>
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          {auction.auction_type === 'progressive_elimination_auction' && (
            <ProgressiveStatusActions 
              auctionId={id} 
              currentStatus={auction.status as any} 
              itemCount={items.length} unpublishedItemCount={unpublishedItemCount}
              approvedCount={approvedCount}
            />
          )}
          {auction.auction_type === 'tender_base_fixed_bid' && (
            <TenderStatusActions 
              auctionId={id} 
              currentStatus={auction.status as any} 
              itemCount={items.length} unpublishedItemCount={unpublishedItemCount}
              approvedCount={approvedCount}
            />
          )}
          {auction.auction_type === 'incremental_approval_auction' && (
            <IncrementalStatusActions 
              auctionId={id} 
              currentStatus={auction.status as any} 
              itemCount={items.length} unpublishedItemCount={unpublishedItemCount}
              approvedCount={approvedCount}
            />
          )}
          <Link 
            href={`/admin/auctions/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--gold)]/20 border border-[var(--gold)]/30 rounded-lg text-[var(--gold)] hover:bg-[var(--gold)]/30 transition-colors"
          >
             Edit Auction
          </Link>
          {auction.status === 'live' && (
            <Link 
              href={`/monitor/auction/${id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-white hover:border-[var(--gold)] transition-colors"
              target="_blank"
            >
               Open Monitor
            </Link>
          )}
          {auction.status === 'live' && (
            <Link 
              href={`/monitor/auction/${id}/item`}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-white hover:border-[var(--gold)] transition-colors"
              target="_blank"
            >
               Item Monitor
            </Link>
          )}
          {auction.status === 'live' && (
            <AuctionChatButton auctionId={id} />
          )}
