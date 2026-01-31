import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublishButton from '@/components/admin/PublishButton'
import SelectWinnerButton from '@/components/admin/SelectWinnerButton'
import AdminControls from '@/components/admin/AdminControls'

export default async function GemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  const supabase = await createClient()

  const { data: gem } = await supabase
    .from('gems')
    .select('*, auction:auctions(name)')
    .eq('id', id)
    .eq('admin_id', user.id)
    .single()

  if (!gem) notFound()

  const { data: images } = await supabase
    .from('gem_images')
    .select('*')
    .eq('gem_id', id)
    .order('display_order')

  const { data: certificates } = await supabase
    .from('gem_certificates')
    .select('*')
    .eq('gem_id', id)

  const { data: bids } = await supabase
    .from('bids')
    .select('*, user:users(email, anonymous_name)')
    .eq('gem_id', id)
    .order('bid_amount', { ascending: false })

  const { data: winner } = await supabase
    .from('auction_winners')
    .select('*, user:users(email, anonymous_name)')
    .eq('gem_id', id)
    .single()

  const highestBid = bids?.[0]?.bid_amount || gem.starting_price
  const currentPrice = gem.current_price || gem.starting_price

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    active: 'bg-emerald-500/20 text-emerald-400',
    ended: 'bg-amber-500/20 text-amber-400',
    completed: 'bg-purple-500/20 text-purple-400',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Link href="/admin/gems" className="text-sm text-[var(--text-muted)] hover:text-white mb-2 inline-block">
            ← Back to Items
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">{gem.name}</h1>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[gem.status]}`}>
              {gem.status.toUpperCase()}
            </span>
            {gem.auction && (
              <span className="text-sm text-[var(--text-muted)]">
                📅 {(gem.auction as { name: string }).name}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-3">
          <Link 
            href={`/monitor/${gem.id}`}
            target="_blank"
            className="btn-outline flex items-center gap-2"
          >
            📺 Monitor
          </Link>
          {gem.status === 'draft' && (
            <>
              <Link href={`/admin/gems/${gem.id}/edit`} className="btn-outline">
                Edit
              </Link>
              <PublishButton gemId={gem.id} />
            </>
          )}
          {gem.status === 'ended' && !winner && (
            <SelectWinnerButton gemId={gem.id} bids={bids || []} />
          )}
        </div>
      </div>

      {/* Admin Controls */}
      <AdminControls 
        gemId={gem.id} 
        currentPrice={currentPrice}
        minIncrement={gem.min_bid_increment}
        status={gem.status}
        roundEndTime={gem.round_end_time}
      />

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Details */}
        <div className="card-glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase">Description</label>
              <p className="text-[var(--text-secondary)] mt-1">{gem.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem label="Starting Price" value={formatCurrency(gem.starting_price)} highlight />
              <InfoItem label="Min Increment" value={formatCurrency(gem.min_bid_increment)} />
              <InfoItem label="Start Time" value={formatDate(gem.start_time)} />
              <InfoItem label="End Time" value={formatDate(gem.end_time)} />
            </div>
            {gem.carat_weight && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                <InfoItem label="Carat Weight" value={`${gem.carat_weight} ct`} />
                {gem.cut && <InfoItem label="Cut" value={gem.cut} />}
                {gem.color && <InfoItem label="Color" value={gem.color} />}
                {gem.clarity && <InfoItem label="Clarity" value={gem.clarity} />}
              </div>
            )}
            {gem.provenance && (
              <div className="pt-4 border-t border-[var(--border)]">
                <label className="text-xs text-[var(--text-muted)] uppercase">Provenance</label>
                <p className="text-[var(--text-secondary)] mt-1">{gem.provenance}</p>
              </div>
            )}
          </div>
        </div>

        {/* Auction Status */}
        <div className="card-glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Auction Status</h2>
          <div className="space-y-6">
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase">Current Highest Bid</label>
              <p className="text-4xl font-bold text-[var(--gold)] mt-1">{formatCurrency(highestBid)}</p>
            </div>
            <div>
              <label className="text-xs text-[var(--text-muted)] uppercase">Total Bids</label>
              <p className="text-2xl font-bold text-white mt-1">{bids?.length || 0}</p>
            </div>
            {winner && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                <label className="text-xs text-emerald-400 uppercase">Winner</label>
                <p className="text-emerald-300 font-bold mt-1">
                  {(winner.user as { anonymous_name?: string; email: string })?.anonymous_name || 
                   (winner.user as { email: string })?.email || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Images */}
      {images && images.length > 0 && (
        <div className="card-glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Images</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.image_url}
                alt={gem.name}
                className="w-full aspect-square object-cover rounded-xl border border-[var(--border)]"
              />
            ))}
          </div>
        </div>
      )}

      {/* Certificates */}
      {certificates && certificates.length > 0 && (
        <div className="card-glass rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">Certificates</h2>
          <div className="space-y-2">
            {certificates.map((cert) => (
              <a
                key={cert.id}
                href={cert.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--gold)]/50 transition-colors"
              >
                <span className="text-2xl">📜</span>
                <span className="text-white">{cert.certificate_type || 'Certificate'}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bid History */}
      <div className="card-glass rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Bid History ({bids?.length || 0})</h2>
        {bids && bids.length > 0 ? (
          <div className="space-y-2">
            {bids.map((bid, idx) => (
              <div
                key={bid.id}
                className={`flex justify-between items-center p-4 rounded-xl border ${
                  idx === 0 ? 'bg-[var(--gold)]/10 border-[var(--gold)]/30' : 'bg-[var(--surface)] border-[var(--border)]'
                }`}
              >
                <div>
                  <p className={`font-bold font-mono ${idx === 0 ? 'text-[var(--gold)]' : 'text-white'}`}>
                    {formatCurrency(bid.bid_amount)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {(bid.user as { anonymous_name?: string; email: string })?.anonymous_name || 
                     (bid.user as { email: string })?.email || 'Unknown'}
                  </p>
                </div>
                <div className="text-right">
                  {idx === 0 && <span className="text-xs text-[var(--gold)] font-bold">LEADING</span>}
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(bid.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-center py-8">No bids yet</p>
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] uppercase">{label}</label>
      <p className={`mt-1 font-medium ${highlight ? 'text-[var(--gold)]' : 'text-white'}`}>{value}</p>
    </div>
  )
}
