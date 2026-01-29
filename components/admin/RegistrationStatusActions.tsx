'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RegistrationApprovalStatus } from '@/types/database'

interface Props {
  auctionId: string
  registrationId: string
  currentStatus: RegistrationApprovalStatus
}

export default function RegistrationStatusActions({ auctionId, registrationId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const updateStatus = async (newStatus: 'approved' | 'rejected') => {
    setLoading(newStatus)
    try {
      const res = await fetch(`/api/admin/auctions/${auctionId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approval_status: newStatus }),
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.message || 'Failed to update')
        return
      }

      router.refresh()
    } catch {
      alert('Failed to update status')
    } finally {
      setLoading(null)
    }
  }

  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => updateStatus('rejected')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        {loading === 'rejected' ? '...' : 'Revoke'}
      </button>
    )
  }

  if (currentStatus === 'rejected') {
    return (
      <button
        onClick={() => updateStatus('approved')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {loading === 'approved' ? '...' : 'Approve'}
      </button>
    )
  }

  // Pending status - show both actions
  return (
    <div className="flex gap-2 justify-end">
      <button
        onClick={() => updateStatus('approved')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
      >
        {loading === 'approved' ? '...' : '✓ Approve'}
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        {loading === 'rejected' ? '...' : '✗ Reject'}
      </button>
    </div>
  )
}
