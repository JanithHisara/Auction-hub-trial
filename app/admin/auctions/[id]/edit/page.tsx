'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Calendar, Image, Users, DollarSign, Gavel, TrendingUp } from 'lucide-react'

function toLocalDatetime(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const offset = d.getTimezoneOffset()
  const local = new Date(d.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

export default function EditAuctionPage() {
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    banner_image_url: '',
    auction_type: 'tender_base_fixed_bid' as 'progressive_elimination_auction' | 'tender_base_fixed_bid',
    registration_start: '',
    registration_end: '',
    auction_start: '',
    auction_end: '',
    max_participants: '',
    entry_fee: '0',
  })

  useEffect(() => {
    async function fetchAuction() {
      try {
        const res = await fetch(`/api/admin/auctions/${id}`)
        if (!res.ok) throw new Error('Failed to fetch auction')
        const auction = await res.json()

        setFormData({
          name: auction.name || '',
          description: auction.description || '',
          banner_image_url: auction.banner_image_url || '',
          auction_type: auction.auction_type || 'tender_base_fixed_bid',
          registration_start: toLocalDatetime(auction.registration_start),
          registration_end: toLocalDatetime(auction.registration_end),
          auction_start: toLocalDatetime(auction.auction_start),
          auction_end: toLocalDatetime(auction.auction_end),
          max_participants: auction.max_participants?.toString() || '',
          entry_fee: auction.entry_fee?.toString() || '0',
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load auction'
        setError(message)
      } finally {
        setFetching(false)
      }
    }
    fetchAuction()
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/auctions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update auction')
      }

      router.push(`/admin/auctions/${id}`)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update auction'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--text-muted)]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link 
        href={`/admin/auctions/${id}`}
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Auction
      </Link>

      <div className="card-glass rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Edit Auction</h1>
        <p className="text-[var(--text-secondary)] mb-8">Update auction details</p>

        {error && (
          <div className="error-message mb-6 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset disabled={loading} className="border-0 p-0 m-0 min-w-0 space-y-8">
          {/* Basic Info */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-sm">1</span>
              Basic Information
            </h2>
            
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Auction Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., Spring Gemstone Collection 2024"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Describe what makes this auction special..."
                className="w-full resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Banner Image URL
              </label>
              <input
                type="url"
                name="banner_image_url"
                value={formData.banner_image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full"
              />
            </div>
          </section>

          {/* Auction Type */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-sm">2</span>
              Auction Type
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <label 
                className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all ${
                  formData.auction_type === 'tender_base_fixed_bid' 
                    ? 'border-[var(--gold)] bg-[var(--gold)]/10' 
                    : 'border-[var(--border)] hover:border-[var(--gold)]/50'
                }`}
              >
                <input
                  type="radio"
                  name="auction_type"
                  value="tender_base_fixed_bid"
                  checked={formData.auction_type === 'tender_base_fixed_bid'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.auction_type === 'tender_base_fixed_bid' ? 'bg-[var(--gold)]' : 'bg-[var(--surface)]'
                  }`}>
                    <TrendingUp className={`w-5 h-5 ${formData.auction_type === 'tender_base_fixed_bid' ? 'text-black' : 'text-[var(--text-muted)]'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Sealed Bid Auction</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Bidders submit any amount above minimum. Highest bid wins.
                    </p>
                  </div>
                </div>
                {formData.auction_type === 'tender_base_fixed_bid' && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[var(--gold)] rounded-full flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </label>

              <label 
                className={`relative cursor-pointer p-5 rounded-xl border-2 transition-all ${
                  formData.auction_type === 'progressive_elimination_auction' 
                    ? 'border-[var(--gold)] bg-[var(--gold)]/10' 
                    : 'border-[var(--border)] hover:border-[var(--gold)]/50'
                }`}
              >
                <input
                  type="radio"
                  name="auction_type"
                  value="progressive_elimination_auction"
                  checked={formData.auction_type === 'progressive_elimination_auction'}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    formData.auction_type === 'progressive_elimination_auction' ? 'bg-[var(--gold)]' : 'bg-[var(--surface)]'
                  }`}>
                    <Gavel className={`w-5 h-5 ${formData.auction_type === 'progressive_elimination_auction' ? 'text-black' : 'text-[var(--text-muted)]'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Progressive Elimination</h3>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Price increases at intervals. Bidders accept or drop out.
                    </p>
                  </div>
                </div>
                {formData.auction_type === 'progressive_elimination_auction' && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-[var(--gold)] rounded-full flex items-center justify-center">
                    <span className="text-black text-xs">✓</span>
                  </div>
                )}
              </label>
            </div>
          </section>

          {/* Schedule */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-sm">3</span>
              Schedule
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Registration Opens *
                </label>
                <input
                  type="datetime-local"
                  name="registration_start"
                  value={formData.registration_start}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Registration Closes *
                </label>
                <input
                  type="datetime-local"
                  name="registration_end"
                  value={formData.registration_end}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Auction Starts *
                </label>
                <input
                  type="datetime-local"
                  name="auction_start"
                  value={formData.auction_start}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  Auction Ends *
                </label>
                <input
                  type="datetime-local"
                  name="auction_end"
                  value={formData.auction_end}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
            </div>
          </section>

          {/* Settings */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-sm">4</span>
              Settings
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Max Participants
                </label>
                <input
                  type="number"
                  name="max_participants"
                  value={formData.max_participants}
                  onChange={handleChange}
                  min="1"
                  placeholder="Unlimited"
                  className="w-full"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Leave empty for unlimited</p>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Entry Fee ($)
                </label>
                <input
                  type="number"
                  name="entry_fee"
                  value={formData.entry_fee}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full"
                />
              </div>
            </div>
          </section>

          <div className="flex items-center gap-4 pt-6 border-t border-[var(--border)]">
            <button
              type="submit"
              disabled={loading}
              className="btn-gold flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
            <Link href={`/admin/auctions/${id}`} className="btn-outline">
              Cancel
            </Link>
          </div>
          </fieldset>
        </form>
      </div>
    </div>
  )
}
