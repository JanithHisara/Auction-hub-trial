'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import type { Gem, GemImage, GemCertificate } from '@/types/database'

interface GemFormProps {
  gem?: Gem & { images?: GemImage[]; certificates?: GemCertificate[] }
}

export default function GemForm({ gem }: GemFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: gem?.name || '',
    description: gem?.description || '',
    starting_price: gem?.starting_price || 0,
    min_bid_increment: gem?.min_bid_increment || 100,
    start_time: gem?.start_time ? new Date(gem.start_time).toISOString().slice(0, 16) : '',
    end_time: gem?.end_time ? new Date(gem.end_time).toISOString().slice(0, 16) : '',
    carat_weight: gem?.carat_weight || '',
    cut: gem?.cut || '',
    color: gem?.color || '',
    clarity: gem?.clarity || '',
    provenance: gem?.provenance || '',
    images: gem?.images?.map(img => img.image_url) || [''],
    certificates: gem?.certificates?.map(cert => ({ url: cert.certificate_url, type: cert.certificate_type || '' })) || [{ url: '', type: '' }],
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const url = gem ? `/api/gems/${gem.id}` : '/api/gems'
      const method = gem ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          images: formData.images.filter(url => url.trim() !== ''),
          certificates: formData.certificates.filter(cert => cert.url.trim() !== ''),
          carat_weight: formData.carat_weight ? parseFloat(formData.carat_weight.toString()) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save gem')
      }

      router.push('/admin/gems')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] })
  }

  const updateImage = (index: number, value: string) => {
    const newImages = [...formData.images]
    newImages[index] = value
    setFormData({ ...formData, images: newImages })
  }

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({ ...formData, images: newImages.length > 0 ? newImages : [''] })
  }

  const addCertificateField = () => {
    setFormData({ ...formData, certificates: [...formData.certificates, { url: '', type: '' }] })
  }

  const updateCertificate = (index: number, field: 'url' | 'type', value: string) => {
    const newCerts = [...formData.certificates]
    newCerts[index] = { ...newCerts[index], [field]: value }
    setFormData({ ...formData, certificates: newCerts })
  }

  const removeCertificate = (index: number) => {
    const newCerts = formData.certificates.filter((_, i) => i !== index)
    setFormData({ ...formData, certificates: newCerts.length > 0 ? newCerts : [{ url: '', type: '' }] })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Basic Information</h2>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Description *</label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Pricing & Auction</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Starting Price *</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.starting_price}
              onChange={(e) => setFormData({ ...formData, starting_price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Minimum Bid Increment *</label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={formData.min_bid_increment}
              onChange={(e) => setFormData({ ...formData, min_bid_increment: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Start Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">End Time *</label>
            <input
              type="datetime-local"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Gem Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Carat Weight</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.carat_weight}
              onChange={(e) => setFormData({ ...formData, carat_weight: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cut</label>
            <input
              type="text"
              value={formData.cut}
              onChange={(e) => setFormData({ ...formData, cut: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Color</label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Clarity</label>
            <input
              type="text"
              value={formData.clarity}
              onChange={(e) => setFormData({ ...formData, clarity: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Provenance</label>
          <textarea
            rows={4}
            value={formData.provenance}
            onChange={(e) => setFormData({ ...formData, provenance: e.target.value })}
            className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Images</h2>
        <div className="space-y-4">
          {formData.images.map((url, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => updateImage(index, e.target.value)}
                placeholder="Image URL"
                className="flex-1 px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
              />
              {formData.images.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addImageField}
            className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--background)] transition-colors shadow-sm"
          >
            Add Image
          </button>
        </div>
      </div>

      <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6">Certificates</h2>
        <div className="space-y-4">
          {formData.certificates.map((cert, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="url"
                value={cert.url}
                onChange={(e) => updateCertificate(index, 'url', e.target.value)}
                placeholder="Certificate URL"
                className="flex-1 px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
              />
              <input
                type="text"
                value={cert.type}
                onChange={(e) => updateCertificate(index, 'type', e.target.value)}
                placeholder="Type (optional)"
                className="w-48 px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
              />
              {formData.certificates.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCertificate(index)}
                  className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addCertificateField}
            className="px-4 py-2 bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--background)] transition-colors shadow-sm"
          >
            Add Certificate
          </button>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 shadow-md"
        >
          {loading ? 'Saving...' : gem ? 'Update Gem' : 'Create Gem'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-3 bg-white border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--background)] transition-colors shadow-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

