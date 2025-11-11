'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishButton({ gemId }: { gemId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this gem? It will become available for bidding.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/gems/${gemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      })

      if (!response.ok) throw new Error('Failed to publish')

      router.refresh()
    } catch (error) {
      alert('Failed to publish gem')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={loading}
      className="px-6 py-3 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 disabled:opacity-50 shadow-md"
    >
      {loading ? 'Publishing...' : 'Publish'}
    </button>
  )
}

