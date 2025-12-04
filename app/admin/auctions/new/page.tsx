'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Calendar, Image, Users, DollarSign } from 'lucide-react'

export default function NewAuctionPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    banner_image_url: '',
    registration_start: '',
    registration_end: '',
    auction_start: '',
    auction_end: '',
    max_participants: '',
    entry_fee: '0',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Validate dates
      const regStart = new Date(formData.registration_start)
      const regEnd = new Date(formData.registration_end)
      const auctionStart = new Date(formData.auction_start)
      const auctionEnd = new Date(formData.auction_end)

      if (regEnd <= regStart) {
        throw new Error('Registration end must be after registration start')
      }
      if (auctionStart <= regEnd) {
        throw new Error('Auction start must be after registration end')
      }
      if (auctionEnd <= auctionStart) {
        throw new Error('Auction end must be after auction start')
      }

      const { data, error: insertError } = await supabase
        .from('auctions')
        .insert({
          admin_id: user.id,
          name: formData.name,
          description: formData.description || null,
          banner_image_url: formData.banner_image_url || null,
          registration_start: formData.registration_start,
          registration_end: formData.registration_end,
          auction_start: formData.auction_start,
          auction_end: formData.auction_end,
          max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
          entry_fee: parseFloat(formData.entry_fee) || 0,
          status: 'draft',
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/admin/auctions/${data.id}`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create auction'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link 
        href="/admin/auctions"
        className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Auctions
      </Link>

      <div className="card-glass rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create New Auction</h1>
        <p className="text-[var(--text-secondary)] mb-8">Set up a new auction event</p>

        {error && (
          <div className="error-message mb-6 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
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

          {/* Schedule */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-sm">2</span>
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
              <span className="w-8 h-8 rounded-lg bg-[var(--gold)]/20 flex items-center justify-center text-sm">3</span>
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
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Auction</span>
              )}
            </button>
            <Link href="/admin/auctions" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

