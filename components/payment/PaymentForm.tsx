'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface PaymentFormProps {
  gemId: string
  amount: number
}

export default function PaymentForm({ gemId, amount }: PaymentFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gem_id: gemId,
          ...formData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Payment failed')
      }

      const data = await response.json()
      router.push(`/gems/${gemId}?payment=success`)
    } catch (err: any) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700 text-sm">
          This is a dummy payment gateway. Any card number will be accepted.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Card Number</label>
        <input
          type="text"
          value={formData.cardNumber}
          onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\s/g, '') })}
          placeholder="1234 5678 9012 3456"
          maxLength={16}
          required
          className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Expiry Date</label>
          <input
            type="text"
            value={formData.expiryDate}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '')
              if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4)
              }
              setFormData({ ...formData, expiryDate: value })
            }}
            placeholder="MM/YY"
            maxLength={5}
            required
            className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">CVV</label>
          <input
            type="text"
            value={formData.cvv}
            onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '') })}
            placeholder="123"
            maxLength={4}
            required
            className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">Cardholder Name</label>
        <input
          type="text"
          value={formData.cardholderName}
          onChange={(e) => setFormData({ ...formData, cardholderName: e.target.value })}
          placeholder="John Doe"
          required
          className="w-full px-4 py-3 bg-white border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)] focus:border-[var(--gold-light)] transition-all"
        />
      </div>

      <div className="pt-4 border-t border-[var(--border)]">
        <div className="flex justify-between items-center mb-6">
          <span className="text-xl font-semibold text-[var(--text-primary)]">Total Amount</span>
          <span className="text-3xl font-bold text-[var(--gold-dark)]">{formatCurrency(amount)}</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-4 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 text-lg shadow-md"
        >
          {loading ? 'Processing...' : 'Complete Payment'}
        </button>
      </div>
    </form>
  )
}

