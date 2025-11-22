'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface AdminControlsProps {
  gemId: string
  currentPrice: number
  status: string
  roundEndTime: string | null
}

export default function AdminControls({ gemId, currentPrice, status, roundEndTime }: AdminControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'start' | 'increment' | 'end' | 'reset_round') => {
    setLoading(true)
    try {
      let endpoint = ''
      let method = 'POST'

      if (action === 'start') {
        // Start = First Round = Set round_end_time
        endpoint = `/api/admin/auctions/${gemId}/start-round`
      } else if (action === 'increment') {
        endpoint = `/api/admin/auctions/${gemId}/increment`
      } else if (action === 'end') {
        endpoint = `/api/admin/auctions/${gemId}/select-winner`
        // Select winner needs bid_id if we were doing manual, but auto logic handles it
        // We'll call the endpoint with empty body as it finds best bid itself now
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) 
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Action failed')
      } else {
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      alert('Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-[var(--border)] rounded-xl p-6 shadow-sm mb-6">
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Auction Controls</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
         <div className="p-4 bg-[var(--background)] rounded-lg">
           <div className="text-sm text-[var(--text-secondary)] mb-1">Current Price</div>
           <div className="text-2xl font-bold text-[var(--gold-dark)]">{formatCurrency(currentPrice)}</div>
         </div>
         <div className="p-4 bg-[var(--background)] rounded-lg">
           <div className="text-sm text-[var(--text-secondary)] mb-1">Status</div>
           <div className="text-2xl font-bold uppercase">{status}</div>
         </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {status === 'active' && !roundEndTime && (
           <button
             onClick={() => handleAction('start')}
             disabled={loading}
             className="px-6 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 disabled:opacity-50"
           >
             Start First Round
           </button>
        )}

        {status === 'active' && roundEndTime && (
           <button
             onClick={() => handleAction('increment')}
             disabled={loading}
             className="px-6 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
           >
             Next Round (Increment)
           </button>
        )}

        {(status === 'active' || status === 'ended') && (
           <button
             onClick={() => handleAction('end')}
             disabled={loading}
             className="px-6 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:opacity-50"
           >
             End Auction & Select Winner
           </button>
        )}
      </div>
    </div>
  )
}

