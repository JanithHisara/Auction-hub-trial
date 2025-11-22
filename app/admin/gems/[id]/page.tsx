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
    .select('*')
    .eq('id', id)
    .eq('admin_id', user.id)
    .single()

  if (!gem) {
    notFound()
  }

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
    .select('*, user:users(email)')
    .eq('gem_id', id)
    .order('bid_amount', { ascending: false })

  const { data: winner } = await supabase
    .from('auction_winners')
    .select('*, user:users(email)')
    .eq('gem_id', id)
    .single()

  const highestBid = bids?.[0]?.bid_amount || gem.starting_price
  const currentPrice = gem.current_price || gem.starting_price

  return (
    <div className="space-y-8">
      {/* Admin Controls Section */}
      <AdminControls 
        gemId={gem.id} 
        currentPrice={currentPrice} 
        status={gem.status}
        roundEndTime={gem.round_end_time}
      />

      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">{gem.name}</h2>
          <p className="text-[var(--text-secondary)] capitalize">Status: {gem.status}</p>
        </div>
        <div className="flex gap-4">
          {gem.status === 'draft' && (
            <>
              <Link
                href={`/admin/gems/${gem.id}/edit`}
                className="px-6 py-3 bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--background)] transition-colors shadow-sm"
              >
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Description</label>
              <p className="text-[var(--text-primary)] mt-1">{gem.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Starting Price</label>
                <p className="text-[var(--gold-dark)] font-semibold mt-1">{formatCurrency(gem.starting_price)}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Min Increment</label>
                <p className="text-[var(--text-primary)] font-semibold mt-1">{formatCurrency(gem.min_bid_increment)}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Start Time</label>
                <p className="text-[var(--text-primary)] mt-1">{formatDate(gem.start_time)}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">End Time</label>
                <p className="text-[var(--text-primary)] mt-1">{formatDate(gem.end_time)}</p>
              </div>
            </div>
            {gem.carat_weight && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[var(--text-secondary)]">Carat Weight</label>
                  <p className="text-[var(--text-primary)] mt-1">{gem.carat_weight} ct</p>
                </div>
                {gem.cut && (
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Cut</label>
                    <p className="text-[var(--text-primary)] mt-1">{gem.cut}</p>
                  </div>
                )}
                {gem.color && (
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Color</label>
                    <p className="text-[var(--text-primary)] mt-1">{gem.color}</p>
                  </div>
                )}
                {gem.clarity && (
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Clarity</label>
                    <p className="text-[var(--text-primary)] mt-1">{gem.clarity}</p>
                  </div>
                )}
              </div>
            )}
            {gem.provenance && (
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Provenance</label>
                <p className="text-[var(--text-primary)] mt-1">{gem.provenance}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Auction Status</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Current Highest Bid</label>
              <p className="text-3xl font-bold text-green-600 mt-1">{formatCurrency(highestBid)}</p>
            </div>
            <div>
              <label className="text-sm text-[var(--text-secondary)]">Total Bids</label>
              <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{bids?.length || 0}</p>
            </div>
            {winner && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <label className="text-sm text-[var(--text-secondary)]">Winner</label>
                <p className="text-green-600 font-semibold mt-1">
                  {(winner.user as any)?.email || 'Unknown'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {images && images.length > 0 && (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.image_url}
                alt={gem.name}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {certificates && certificates.length > 0 && (
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Certificates</h3>
          <div className="space-y-2">
            {certificates.map((cert) => (
              <a
                key={cert.id}
                href={cert.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg hover:border-[var(--gold-light)] hover:bg-[var(--gold-light)]/5 transition-colors"
              >
                <span className="text-[var(--text-primary)]">{cert.certificate_type || 'Certificate'}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Bid History</h3>
        <div className="space-y-2">
          {bids && bids.length > 0 ? (
            bids.map((bid) => (
              <div
                key={bid.id}
                className="flex justify-between items-center p-4 bg-[var(--background)] border border-[var(--border)] rounded-lg"
              >
                <div>
                  <p className="text-[var(--text-primary)] font-semibold">{formatCurrency(bid.bid_amount)}</p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {(bid.user as any)?.email || 'Unknown'} • {formatDate(bid.created_at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-[var(--text-secondary)] text-center py-8">No bids yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

